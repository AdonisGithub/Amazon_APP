import CsI18n from "../../components/csI18n";

export const featureList = [
    // {
    //     name: "catalog",
    //     label: CsI18n.t("Catalog"),
    //     comment: CsI18n.t("Active inventory management, synchronizing your a store and Amazon"),
    // },
    {
        name: "product",
        label: CsI18n.t("Products"),
        comment: CsI18n.t("Allow to create and import products from Shopify to Amazon"),
    },
    {
        name: "order",
        label: CsI18n.t("Orders"),
        comment: CsI18n.t("Import orders from Amazon"),
    },
    {
        name: "advanced",
        label: CsI18n.t("Advanced"),
        comment: CsI18n.t("Add advanced support; products import, export, creation, FBA, Business, Prime"),
    },
];

export const workflowTabs = [
    // {
    //     id: "feature",
    //     content: CsI18n.t("Features"),
    //     accessibilityLabel: CsI18n.t("Features"),
    //     panelID: "feature"
    // },
    {
        id: "platform",
        content: CsI18n.t("Platforms"),
        accessibilityLabel: CsI18n.t("Platforms"),
        panelID: "platform"
    },
    {
        id: "inventory",
        content: CsI18n.t("Inventory"),
        accessibilityLabel: CsI18n.t("Inventory"),
        panelID: "inventory"
    },
    {
        id: "orders",
        content: CsI18n.t("Orders"),
        accessibilityLabel: CsI18n.t("Orders"),
        panelID: "orders"
    },
    {
        id: "products",
        content: CsI18n.t("Products"),
        accessibilityLabel: CsI18n.t("Products"),
        panelID: "products"
    },
    {
        id: "metafields",
        content: CsI18n.t("Metafields"),
        accessibilityLabel: CsI18n.t("Metafields"),
        panelID: "metafields",
        allowed_plan: 1
    },
    {
        id: "fba",
        content: CsI18n.t("Amazon FBA"),
        accessibilityLabel: CsI18n.t("Amazon FBA"),
        panelID: "fba",
        allowed_plan: 2
    },
    {
        id: "locations",
        content: CsI18n.t("Locations"),
        accessibilityLabel: CsI18n.t("Locations"),
        panelID: "locations"
    },
    {
        id: "collections",
        content: CsI18n.t("Collections"),
        accessibilityLabel: CsI18n.t("Collections"),
        panelID: "collections"
    }
];
