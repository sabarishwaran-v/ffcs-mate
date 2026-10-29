import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

interface OfferingInput {
  slot: string;
  faculty: string;
  venue: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      courseCode,
      courseTitle,
      courseType,
      credits,
      offerings,
      userUid,
      clientFingerprint
    } = body;

    if (!courseCode || typeof courseCode !== 'string') {
      return NextResponse.json({ error: 'Valid course code is required' }, { status: 400 });
    }

    if (!Array.isArray(offerings) || offerings.length === 0) {
      return NextResponse.json({ error: 'At least one offering is required' }, { status: 400 });
    }

    const cleanCourseCode = courseCode.trim().toUpperCase();
    const db = getAdminDb();

    // 1. Check if course is already approved in system/approved_faculties_bundle
    const bundleDoc = await db.doc('system/approved_faculties_bundle').get();
    if (bundleDoc.exists) {
      const bundleData = bundleDoc.data() || {};
      const isAlreadyApproved = Object.values(bundleData).some(
        (f: any) => f.courseCode === cleanCourseCode && f.faculty && f.faculty !== '-'
      );

      if (isAlreadyApproved) {
        return NextResponse.json({
          success: true,
          status: 'already_approved',
          message: `${cleanCourseCode} is already approved and public to all students.`
        });
      }
    }

    // 2. Normalize offerings and compute canonical fingerprint hash
    const normalizedOfferings: OfferingInput[] = offerings.map((o: any) => ({
      slot: String(o.slot || '').trim().toUpperCase(),
      faculty: String(o.faculty || '').trim(),
      venue: String(o.venue || 'TBA').trim().toUpperCase()
    })).filter(o => o.slot && o.faculty && o.faculty !== '-');

    if (normalizedOfferings.length === 0) {
      return NextResponse.json({ error: 'No valid offerings after normalization' }, { status: 400 });
    }

    // Sort deterministically to generate a consistent hash across any student upload
    normalizedOfferings.sort((a, b) => {
      const slotDiff = a.slot.localeCompare(b.slot);
      if (slotDiff !== 0) return slotDiff;
      return a.faculty.localeCompare(b.faculty);
    });

    const canonicalJson = JSON.stringify(normalizedOfferings);
    const hash = crypto.createHash('sha256').update(canonicalJson).digest('hex').substring(0, 16);

    const submitterId = userUid || clientFingerprint || req.headers.get('x-forwarded-for') || 'anon';
    const submissionDocId = `${cleanCourseCode}_${hash}_${submitterId.replace(/[^a-zA-Z0-9]/g, '_')}`;

    // 3. Save pending submission
    const submissionRef = db.collection('pending_submissions').doc(submissionDocId);
    await submissionRef.set({
      courseCode: cleanCourseCode,
      courseTitle: courseTitle || cleanCourseCode,
      courseType: courseType || 'Theory and Lab',
      credits: credits || 4,
      hash,
      offeringsCount: normalizedOfferings.length,
      offerings: normalizedOfferings,
      submittedAt: FieldValue.serverTimestamp(),
      submitterId,
      status: 'pending'
    }, { merge: true });

    // Also register in legacy pending_faculties for admin dashboard visibility
    const batch = db.batch();
    normalizedOfferings.forEach(offering => {
      const pendingDocId = `${cleanCourseCode}_${offering.slot}_${offering.faculty.replace(/\s+/g, '_')}`;
      const legacyRef = db.collection('pending_faculties').doc(pendingDocId);
      batch.set(legacyRef, {
        courseCode: cleanCourseCode,
        courseName: courseTitle || cleanCourseCode,
        slot: offering.slot,
        facultyName: offering.faculty,
        venue: offering.venue,
        submittedByUid: submitterId,
        submittedByName: 'Mock HTML Crowdsource',
        submittedAt: FieldValue.serverTimestamp(),
        status: 'pending',
        hash
      }, { merge: true });
    });
    await batch.commit();

    // 4. Check for Consensus: Count unique submissions matching this exact hash
    const matchingDocsSnap = await db.collection('pending_submissions')
      .where('courseCode', '==', cleanCourseCode)
      .where('hash', '==', hash)
      .where('status', '==', 'pending')
      .get();

    const matchingCount = matchingDocsSnap.size;
    const CONSENSUS_THRESHOLD = 2; // When 2 independent submissions match, auto-approve!

    if (matchingCount >= CONSENSUS_THRESHOLD) {
      // Auto-approve and publish to approved_faculties_bundle!
      const bundleUpdates: Record<string, any> = {};

      normalizedOfferings.forEach(offering => {
        const docId = `${cleanCourseCode}_${offering.slot}_${offering.faculty.replace(/[^a-zA-Z0-9]/g, '_')}`;
        bundleUpdates[docId] = {
          id: docId,
          courseCode: cleanCourseCode,
          courseTitle: courseTitle || cleanCourseCode,
          slot: offering.slot,
          faculty: offering.faculty,
          venue: offering.venue,
          approvedAt: new Date().toISOString(),
          approvedBy: `Auto-Approved (Community Consensus: ${matchingCount} matches)`
        };
      });

      await db.doc('system/approved_faculties_bundle').set(bundleUpdates, { merge: true });

      // Mark matching pending submissions as approved
      const approvalBatch = db.batch();
      matchingDocsSnap.docs.forEach(docSnap => {
        approvalBatch.update(docSnap.ref, { status: 'approved', approvedAt: FieldValue.serverTimestamp() });
      });

      // Also clean up pending_faculties for this course
      normalizedOfferings.forEach(offering => {
        const pendingDocId = `${cleanCourseCode}_${offering.slot}_${offering.faculty.replace(/\s+/g, '_')}`;
        approvalBatch.delete(db.collection('pending_faculties').doc(pendingDocId));
      });

      await approvalBatch.commit();

      return NextResponse.json({
        success: true,
        status: 'auto_approved',
        matchingCount,
        message: `${cleanCourseCode} matched consensus (${matchingCount} verified submissions) and is now live for all students!`
      });
    }

    return NextResponse.json({
      success: true,
      status: 'pending',
      matchingCount,
      threshold: CONSENSUS_THRESHOLD,
      message: `Crowdsource received! (${matchingCount}/${CONSENSUS_THRESHOLD} matching submissions for auto-approval)`
    });
  } catch (error: any) {
    console.error('Error submitting crowdsourced HTML:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
