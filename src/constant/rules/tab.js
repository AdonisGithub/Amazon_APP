import CsI18n from "../../components/csI18n";

export const rulesTabs = [
    {
        id: "markup",
        content: CsI18n.t('Markups'),
        accessibilityLabel: CsI18n.t('Markups'),
        panelID: "markups",
        hasVideo: true,
    },
    {
        id: "sale",
        content: CsI18n.t('Sales'),
        accessibilityLabel: CsI18n.t('Sales'),
        panelID: "sales",
        hasVideo: false,
    },
    {
        id: "filter",
        content: CsI18n.t('Exclusions'),
        accessibilityLabel: CsI18n.t('Exclusions'),
        panelID: "filters",
        hasVideo: false,
    },
    {
        id: "inventory",
        content: CsI18n.t('Inventory'),
        accessibilityLabel: CsI18n.t('Inventory'),
        panelID: "inventory",
        hasVideo: false,
    },
    // Suppressed on 2021/04/04 by Olivier, no need anymore, we can handle from models
    {
        id: "categories",
        content: CsI18n.t('Categories'),
        accessibilityLabel: CsI18n.t('Categories'),
        panelID: "categories",
        hasVideo: false,
    },
    {
        id: "taxes",
        content: CsI18n.t('Taxes'),
        accessibilityLabel: CsI18n.t('Taxes'),
        panelID: "taxes",
        hasVideo: false,
    },
    {
        id: "orders",
        content: CsI18n.t('Orders'),
        accessibilityLabel: CsI18n.t('Orders'),
        panelID: "orders",
        hasVideo: false,
    },
    {
        id: "shipping",
        content: CsI18n.t('Shipping'),
        accessibilityLabel: CsI18n.t('Shipping'),
        panelID: "shipping",
        hasVideo: false,
    },
    {
        id: "business",
        content: CsI18n.t('Business'),
        accessibilityLabel: CsI18n.t('Business'),
        panelID: "business",
        hasVideo: false,
        allowed_plan: 2,
    },
];

