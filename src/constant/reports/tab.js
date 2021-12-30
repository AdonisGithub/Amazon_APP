import CsI18n from "../../components/csI18n";

export const reportsTabs = [
    {
        id: "inventory",
        content: CsI18n.t('Inventory'),
        accessibilityLabel: CsI18n.t('Inventory'),
        panelID: "inventory"
    },
    {
        id: "orders",
        content: CsI18n.t('Orders'),
        accessibilityLabel: CsI18n.t('Orders'),
        panelID: "orders"
    },
];