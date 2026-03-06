# Copyright (c) 2026, Ali & Talal and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Product(Document):
    pass


def after_insert(doc, method=None):

    # check if item already exists
    if frappe.db.exists("Item", doc.product):
        return

    item = frappe.new_doc("Item")

    item.item_code = doc.product
    item.item_name = doc.product_name
    item.item_group = doc.group
    item.stock_uom = doc.uom

    # Add UOM child table
    item.append("uoms", {
        "uom": doc.uom,
        "conversion_factor": 1
    })

    item.insert(ignore_permissions=True)