frappe.ui.form.on("Product Cost Calculator", {

    refresh(frm) {

        // Add Quote Button
        frm.add_custom_button("Add To Quote", function() {

            let product = frm.doc.product_name || "";
            let width = frm.doc.width || 0;
            let height = frm.doc.height || 0;
            let qty = frm.doc.quantity || 0;
            let remarks = frm.doc.remarks || "";
            let group = frm.product_data ? frm.product_data.group : "";

            let sqm = ((width * height) / 1000000).toFixed(2);

            let charge = frm.doc.calculated_charge || 0;

            // Quote text for individual product
            let quote_text = `
Product: ${product}
Size Sqm: ${sqm}

Width (mm): ${width}          Height (mm): ${height}

Quantity: ${qty}              Group: ${group}

Total Charge: £${charge.toFixed(2)}

Remarks: ${remarks}
`;

            // Set the per-product quotes field
            frm.set_value("quotes", quote_text);

            // --- Calculate Quote Totals ---
            let material_cost = 0;
            let or_cost = 0;
            let total_cost = 0;
            let markup_value = 0;
            let profit_percent = 0;

            if (frm.product_data.product_type == "Area Based") {
                material_cost = sqm * (
                    (frm.product_data.ink_cost || 0) +
                    (frm.product_data.sheet_cost || 0) +
                    (frm.product_data.lemination_cost || 0)
                ) * qty;

                or_cost = sqm * (frm.product_data.or_cost || 0) * qty;

                total_cost = material_cost + or_cost;
                markup_value = charge - total_cost;

                if (charge > 0) {
                    profit_percent = (markup_value / charge) * 100;
                }

            } else {
                material_cost = frm.product_data.unit_price || 0;
                total_cost = material_cost * qty;
                markup_value = charge - total_cost;

                if (charge > 0) {
                    profit_percent = (markup_value / charge) * 100;
                }
            }

            // Set the quote_totals field
            frm.set_value("quote_totals", `
Quote Totals

Total Charge RRP: £${charge.toFixed(2)}

Total Material Cost Per Quote: £${material_cost.toFixed(2)}

Total O&R Cost Per Quote: £${or_cost.toFixed(2)}

Markup £ Per Quote: £${markup_value.toFixed(2)}

Net Profit % Per Quote: ${profit_percent.toFixed(2)}%
`);
        });

    },

    product(frm) {

        if (!frm.doc.product) return;

        frappe.db.get_doc("Product", frm.doc.product).then(product => {

            frm.set_value("product_name", product.product_name);

            // store product values
            frm.product_data = product;

            // show/hide width height
            if (product.product_type == "Area Based") {
                frm.toggle_display("width", true);
                frm.toggle_display("height", true);
            } else {
                frm.toggle_display("width", false);
                frm.toggle_display("height", false);
            }

        });

    },

    width: calculate_cost,
    height: calculate_cost,
    quantity: calculate_cost,
    mark_up: calculate_cost

});


function calculate_cost(frm) {

    let product = frm.product_data;

    if (!product) return;

    let qty = frm.doc.quantity || 0;
    let markup = frm.doc.mark_up || 0;

    let sqm = 0;
    let material_cost = 0;
    let or_cost = 0;
    let total_cost = 0;
    let charge = 0;

    if (product.product_type == "Area Based") {

        let width = frm.doc.width || 0;
        let height = frm.doc.height || 0;

        sqm = (width * height) / 1000000;

        material_cost = sqm * (
            (product.ink_cost || 0) +
            (product.sheet_cost || 0) +
            (product.lemination_cost || 0)
        );

        or_cost = sqm * (product.or_cost || 0);

        total_cost = (material_cost + or_cost) * qty;

        charge = total_cost * (1 + markup / 100);

    } else {

        material_cost = product.unit_price || 0;

        total_cost = material_cost * qty;

        charge = total_cost * (1 + markup / 100);

    }

    let markup_value = charge - total_cost;

    let profit_percent = 0;

    if (charge > 0) {
        profit_percent = (markup_value / charge) * 100;
    }

    // store charge for quote button
    frm.set_value("calculated_charge", charge);

    frm.set_value("calculation_results", `
Calculation Results

Total Charge RRP: £${charge.toFixed(2)}

Sq. Meter Per Product: ${sqm.toFixed(4)}

Materials Per Product: £${material_cost.toFixed(2)}

O&R Per Product: £${or_cost.toFixed(2)}

Total Cost Per Product Line: £${total_cost.toFixed(2)}

Markup £ Per Product: £${markup_value.toFixed(2)}

Net Profit % Per Product: ${profit_percent.toFixed(2)}%

Remarks: ${frm.doc.remarks || ""}
`);

}