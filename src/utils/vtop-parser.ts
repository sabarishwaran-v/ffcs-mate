// VTOP Parser derived from competitor logic

export function isMorningSlot(slot: string): boolean {
  // Simple check for now based on VTOP structure
  // Lab slots L1-L30 are morning
  if (slot.startsWith("L")) {
    const num = parseInt(slot.substring(1));
    return num <= 30;
  }
  // Theory slots ending with 1 (A1, B1) are morning
  return slot.endsWith("1");
}

export function parseVTOPData(rawInput: string) {
  const lines = rawInput.split('\n').filter(line => line.trim() !== '');
  const parsedData: any[] = [];
  let errorCount = 0;

  lines.forEach((line) => {
    // Attempt to split by tab first, then by multiple spaces
    const parts = line.split('\t').map(p => p.trim());
    let slotDetail = "";
    let venue: string[] = [];
    let faculty = "";
    let type = "";

    if (parts.length >= 3) {
      slotDetail = parts[0];
      type = parts[3] || "TH"; // default to theory if missing
      venue = parts[1].split(",");
      faculty = parts[2];
    } else {
      // Fallback to splitting by multiple spaces
      const spaceParts = line.split(/\s{2,}/).map(p => p.trim());
      if (spaceParts.length >= 3) {
        slotDetail = spaceParts[0];
        venue = [spaceParts[1]];
        faculty = spaceParts[2];
      } else {
        errorCount++;
        return; // Skip this line if parsing fails
      }
    }

    const slotArray = slotDetail
      .split('+')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (faculty && slotArray.length > 0) {
      const morningSlots = slotArray.filter(slot => isMorningSlot(slot));
      const afternoonSlots = slotArray.filter(slot => !isMorningSlot(slot));

      parsedData.push({
        facultyName: faculty,
        slots: slotArray,
        morningSlots,
        afternoonSlots,
        venue,
        type
      });
    } else {
      errorCount++;
    }
  });

  return {
    success: parsedData.length > 0,
    addedCount: parsedData.length,
    errorCount,
    data: parsedData
  };
}
