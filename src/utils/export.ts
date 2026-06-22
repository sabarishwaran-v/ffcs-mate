/**
 * Exports the timetable as a PDF file
 * @param element The HTML element to export
 * @param filename The name of the PDF file
 */
export async function exportToPdf(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  // Add a class to the element for styling during export
  const jsPDF = (await import("jspdf")).default;
  const html2canvas = (await import("html2canvas-pro")).default;
  element.classList.add("exporting");

  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");

    // Determine orientation based on dimensions
    const isLandscape = canvas.width > canvas.height;

    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
    });

    // Calculate dimensions to fit the page
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate scale to fit the page with margins
    const margin = 10; // 10mm margin
    const availableWidth = pageWidth - 2 * margin;
    const availableHeight = pageHeight - 2 * margin;

    // Calculate image dimensions to maintain aspect ratio
    const imgWidth = availableWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If image is too tall, scale based on height instead
    if (imgHeight > availableHeight) {
      const scaleFactor = availableHeight / imgHeight;
      const newImgWidth = imgWidth * scaleFactor;
      const newImgHeight = imgHeight * scaleFactor;

      // Center the image horizontally
      const xOffset = margin + (availableWidth - newImgWidth) / 2;
      pdf.addImage(imgData, "PNG", xOffset, margin, newImgWidth, newImgHeight);
    } else {
      // Center the image horizontally
      const xOffset = margin;
      pdf.addImage(imgData, "PNG", xOffset, margin, imgWidth, imgHeight);
    }

    // Save the PDF
    pdf.save(filename);
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  } finally {
    // Remove the export class
    element.classList.remove("exporting");
  }
}

/**
 * Exports the timetable as an image
 * @param element The HTML element to export
 * @param filename The name of the image file
 */
export async function exportToImage(
  element: HTMLElement,
  filename: string,
): Promise<void> {
  // Add a class to the element for styling during export
  element.classList.add("exporting");
  element.classList.add("bg-card");
  const html2canvas = (await import("html2canvas-pro")).default;
  try {
    const canvas = await html2canvas(element, {
      scale: 2, // Higher scale for better quality
      useCORS: true,
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight,
    });

    // Remove the export class
    element.classList.remove("exporting");
    element.classList.remove("bg-card");

    // Create a download link
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } catch (error) {
    // Remove the export class in case of error
    element.classList.remove("exporting");
    console.error("Error exporting to image:", error);
    throw error;
  }
}
