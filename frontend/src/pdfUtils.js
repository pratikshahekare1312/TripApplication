import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to safely format currency strings without broken characters
const formatCurrency = (str) => {
  if (str === null || str === undefined) return "Rs. 0";
  return String(str).replace(/₹/g, "Rs. ").replace(/¹/g, "Rs. ");
};

export const generateItineraryPDF = async (tripData) => {
  if (!tripData) {
    alert("No trip data available for PDF export.");
    return false;
  }

  try {
    const doc = new jsPDF();
    let yPos = 15;

    // 1. HEADER BANNER
    doc.setFillColor(30, 41, 59); // Slate Dark
    doc.rect(0, 0, 210, 25, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TRAVELSMART - COMPLETE TRIP REPORT", 14, 16);

    yPos = 32;

    // 2. SECTION 1: USER INPUTS & PREFERENCES
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. User Selected Preferences (Form Inputs & Interests)", 14, yPos);
    yPos += 5;

    const travelDetails = tripData.travel_details || {};
    const estCost = tripData.estimated_cost || {};
    const userInputs = tripData.user_inputs || {};

    const basicPreferences = [
      ["Origin City", travelDetails.origin_city || userInputs.origin_city || tripData.origin_city || "N/A", "Destination", tripData.destination || tripData.destination_state || "N/A"],
      ["Duration", `${tripData.total_days || tripData.days || userInputs.days || 3} Days`, "Travellers", tripData.group_type || userInputs.group_type || "N/A"],
      ["Group Composition", (userInputs.group_composition?.length > 0) ? userInputs.group_composition.join(", ") : "Standard", "Budget Level", tripData.budget_level || userInputs.budget_level || "Mid"],
      ["Trip Vibe", tripData.vibe || userInputs.vibe || "Chill", "Crowd Preference", tripData.crowd_preference || userInputs.crowd_preference || "Medium"],
      ["Spot Preference", tripData.prefers_offbeat || userInputs.prefers_offbeat || "No preference", "Estimated Total", formatCurrency(estCost.estimated_total)]
    ];

    autoTable(doc, {
      startY: yPos,
      body: basicPreferences,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, font: "helvetica" },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [51, 65, 85] },
        2: { fontStyle: 'bold', fillColor: [241, 245, 249], textColor: [51, 65, 85] }
      }
    });

    yPos = doc.lastAutoTable.finalY + 6;

    // Must & Avoid Interests Detector
    const mustTags = tripData.must_tags || userInputs.must_tags || [];
    const avoidTags = tripData.avoid_tags || userInputs.avoid_tags || [];

    const interestsData = [
      ["Must Have Interests (Green Ticks)", mustTags.length > 0 ? mustTags.join(" | ") : "Balanced Selection"],
      ["Avoid Interests (Red Ticks)", avoidTags.length > 0 ? avoidTags.join(" | ") : "No Exclusions"]
    ];

    autoTable(doc, {
      startY: yPos,
      body: interestsData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, font: "helvetica" },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [6, 78, 59], width: 55 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 8;

    // 3. SECTION 2: COST & TRAVEL BREAKDOWN
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("2. Cost Breakdown & Getting There", 14, yPos);
    yPos += 5;

    const budgetBreakdownData = [
      ["Stay Cost Est.", formatCurrency(estCost.stay), "Travel Mode", travelDetails.recommended_mode || "Train"],
      ["Meals Cost Est.", formatCurrency(estCost.meals), "One-Way Distance", `${travelDetails.one_way_distance_km || 0} km`],
      ["Local Transport", formatCurrency(estCost.local_transport), "Round-Trip Distance", `${travelDetails.round_trip_distance_km || 0} km`],
      ["Entry Fees Total", formatCurrency(estCost.entry_fees), "Transit Cost Est.", formatCurrency(estCost.travel_to_destination || travelDetails.cost_inr)]
    ];

    autoTable(doc, {
      startY: yPos,
      body: budgetBreakdownData,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, font: "helvetica" },
      columnStyles: {
        0: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] },
        2: { fontStyle: 'bold', fillColor: [248, 250, 252], textColor: [71, 85, 105] }
      }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // 4. SECTION 3: DAY BY DAY ITINERARY PLAN
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text("3. Day-by-Day Customized Plan", 14, yPos);
    yPos += 7;

    const itinerary = tripData.itinerary || [];

    itinerary.forEach((dayData) => {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFillColor(226, 232, 240);
      doc.rect(14, yPos, 182, 7, 'F');
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      doc.text(`DAY ${dayData.day}: ${dayData.theme || 'Exploration'}`, 18, yPos + 5);

      yPos += 11;

      const places = dayData.places || [];

      places.forEach((place) => {
        if (yPos > 235) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(2, 132, 199);
        doc.text(`${place.time_slot || 'Anytime'} - ${place.name} (${place.match_score || 100}% Match)`, 14, yPos);
        yPos += 4.5;

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        
        let metaText = `Type: ${place.type || 'Attraction'}  |  Duration: ${place.duration_hrs || 1} hrs  |  Entry Fee: ${formatCurrency(place.entry_fee_inr ?? 0)}`;
        if (place.distance_from_previous_km) {
          metaText += `  |  Next Stop: ${place.distance_from_previous_km} km (Est. ${formatCurrency(place.local_transport_cost_from_previous_inr || 0)})`;
        }
        doc.text(metaText, 14, yPos);
        yPos += 4.5;

        if (place.activities && place.activities.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Activities: ", 14, yPos);
          doc.setFont("helvetica", "normal");
          const actList = doc.splitTextToSize(place.activities.join(", "), 155);
          doc.text(actList, 32, yPos);
          yPos += (actList.length * 3.8);
        }

        if (place.local_cuisine && place.local_cuisine.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.text("Must Try: ", 14, yPos);
          doc.setFont("helvetica", "normal");
          doc.text(place.local_cuisine.join(", "), 32, yPos);
          yPos += 4;
        }

        const matched = place.match_breakdown?.matched_reasons || [];
        if (matched.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(16, 185, 129);
          const matchStr = doc.splitTextToSize("Highlights: " + matched.join(" | "), 175);
          doc.text(matchStr, 14, yPos);
          yPos += (matchStr.length * 3.8);
        }

        if (place.avoid_if) {
          doc.setFont("helvetica", "italic");
          doc.setTextColor(225, 29, 72);
          const avoidText = doc.splitTextToSize(`Caution: ${place.avoid_if}`, 175);
          doc.text(avoidText, 14, yPos);
          yPos += (avoidText.length * 3.8);
        }

        yPos += 4;
      });

      yPos += 3;
    });

    // 5. SECTION 4: OPTIONAL ATTRACTIONS (LOW MATCH 40-59%)
    // Try all possible backend key names for forward compatibility
    const optionalSpots =
      tripData.optional_low_match_places ??
      tripData.optional_attractions ??
      tripData.optional_places ??
      [];

    if (optionalSpots.length > 0) {
      if (yPos > 210) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(217, 119, 6);
      doc.text("4. Optional Attractions (Low Match Score: 40% - 59%)", 14, yPos);
      yPos += 5;

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.text("Note: These places have lower match scores based on your inputs, but you can visit if you have spare time.", 14, yPos);
      yPos += 7;

      optionalSpots.forEach((spot) => {
        if (yPos > 235) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(9.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(217, 119, 6);
        doc.text(`${spot.name} (${spot.city || 'Destination'}) - ${spot.match_score}% Match`, 14, yPos);
        yPos += 4;

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        // Optional spots use time_to_visit_hrs and entrance_fee_inr (backend schema)
        const spotDuration = spot.time_to_visit_hrs ?? spot.duration_hrs ?? 1;
        const spotFee = spot.entrance_fee_inr ?? spot.entry_fee_inr ?? 0;
        doc.text(`Type: ${spot.type || 'Attraction'}  |  Duration: ${spotDuration} hrs  |  Entry: ${formatCurrency(spotFee)}`, 14, yPos);
        yPos += 4;

        const matched = spot.match_breakdown?.matched_reasons || [];
        const mismatched = spot.match_breakdown?.mismatched_reasons || [];

        if (matched.length > 0) {
          doc.setTextColor(16, 185, 129);
          const prosText = doc.splitTextToSize("Pros: " + matched.join(" | "), 175);
          doc.text(prosText, 14, yPos);
          yPos += (prosText.length * 3.8);
        }

        if (mismatched.length > 0) {
          doc.setTextColor(225, 29, 72);
          const consText = doc.splitTextToSize("Cons: " + mismatched.join(" | "), 175);
          doc.text(consText, 14, yPos);
          yPos += (consText.length * 3.8);
        }

        if (spot.activities && spot.activities.length > 0) {
          doc.setTextColor(71, 85, 105);
          const actText = doc.splitTextToSize("Activities: " + spot.activities.join(", "), 175);
          doc.text(actText, 14, yPos);
          yPos += (actText.length * 3.8);
        }

        yPos += 4;
      });
    }
    // If optionalSpots is empty, Section 4 is silently skipped — no placeholder text printed.

    const destName = tripData.destination || tripData.destination_state || "Trip";
    doc.save(`${destName.replace(/\s+/g, '_')}_Detailed_Itinerary.pdf`);
    return true;
  } catch (err) {
    // Log to console only — do NOT call alert() as it triggers UI error banners
    console.error("PDF Export error:", err);
    return false;
  }
};