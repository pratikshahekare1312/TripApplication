import jsPDF from 'jspdf';

export const generateItineraryPDF = (data) => {
  try {
    const doc = new jsPDF();
    let y = 20;
    
    // Helper to add page if needed
    const checkPageBreak = (needed = 10) => {
      if (y + needed > 280) {
        doc.addPage();
        y = 20;
      }
    };

    doc.setFontSize(22);
    doc.text(`TRAVEL ITINERARY`, 105, y, { align: 'center' });
    y += 15;

    doc.setFontSize(14);
    doc.text(`Destination: ${data.destination}`, 20, y);
    y += 8;
    
    if (data.travel_details?.origin_city) {
      doc.text(`Origin: ${data.travel_details.origin_city}`, 20, y);
      y += 8;
    }
    
    doc.text(`Days: ${data.total_days}`, 20, y);
    y += 8;
    doc.text(`Travellers: ${data.group_type}`, 20, y);
    y += 8;
    doc.text(`Budget Level: ${data.budget_level}`, 20, y);
    y += 15;

    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    data.itinerary.forEach((dayData) => {
      checkPageBreak(30);
      
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text(`DAY ${dayData.day}`, 20, y);
      y += 8;
      
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`${dayData.theme}`, 20, y);
      y += 10;

      if (dayData.note) {
        checkPageBreak(20);
        const splitNote = doc.splitTextToSize(dayData.note, 170);
        doc.text(splitNote, 20, y);
        y += splitNote.length * 6 + 10;
      } else {
        dayData.places.forEach(place => {
          checkPageBreak(40);
          
          doc.setFontSize(12);
          doc.setFont(undefined, 'bold');
          doc.text(`${place.time_slot} - ${place.name}`, 20, y);
          y += 6;
          
          doc.setFontSize(11);
          doc.setFont(undefined, 'normal');
          doc.text(`Location: ${place.city} | Type: ${place.type}`, 20, y);
          y += 6;
          
          if (place.entry_fee_inr > 0) {
            doc.text(`Est. Cost: Rs. ${place.entry_fee_inr}`, 20, y);
            y += 6;
          }
          
          if (place.activities && place.activities.length > 0) {
            doc.text(`Activities: ${place.activities.join(', ')}`, 20, y);
            y += 6;
          }
          
          y += 6; // Spacing between places
        });
      }
      
      checkPageBreak(20);
      doc.setLineWidth(0.5);
      doc.line(20, y, 190, y);
      y += 10;
    });

    doc.save(`${data.destination}_Itinerary.pdf`);
    return true;
  } catch (error) {
    console.error("PDF generation failed:", error);
    return false;
  }
};
