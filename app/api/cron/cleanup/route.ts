import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Check authorization header for Vercel Cron
  // You can set CRON_SECRET in Vercel environment variables
  const authHeader = request.headers.get('authorization');
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  try {
    const adminDb = getAdminDb();
    const roomsRef = adminDb.collection('rooms');
    const snapshot = await roomsRef.get();
    
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    let deletedCount = 0;

    const batch = adminDb.batch();

    snapshot.docs.forEach((doc: any) => {
      const data = doc.data();
      const createdAt = data.createdAt ? (data.createdAt.toMillis ? data.createdAt.toMillis() : data.createdAt) : 0;
      const lastUpdatedStr = data.sharedTimetable?.lastUpdated;
      const lastUpdated = lastUpdatedStr ? new Date(lastUpdatedStr).getTime() : createdAt;
      
      const hasMembers = data.memberIds && data.memberIds.length > 0;
      
      // If no members are left AND the room is older than 24 hours, OR if it hasn't been updated in 48 hours regardless of members
      const isGhostRoom = !hasMembers && (now - createdAt > ONE_DAY_MS);
      const isStaleRoom = (now - lastUpdated > ONE_DAY_MS * 2);

      if (isGhostRoom || isStaleRoom) {
        batch.delete(doc.ref);
        deletedCount++;
        // NOTE: We could also query and delete associated invitations here if needed
      }
    });

    if (deletedCount > 0) {
      await batch.commit();
    }

    return NextResponse.json({ success: true, deletedRooms: deletedCount });
  } catch (error: any) {
    console.error('Cleanup Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
