import CsI18n from "../../components/csI18n";

export const actionsTabs = [
    {
        id: "catalog",
        content: CsI18n.t('Catalog'),
        accessibilityLabel: CsI18n.t('Catalog'),
        panelID: "catalog",
    },
    {
        id: "orders",
        content: CsI18n.t('Orders'),
        accessibilityLabel: CsI18n.t('Orders'),
        panelID: "orders",
    },
    {
        id: "operations",
        content: CsI18n.t('Operations'),
        accessibilityLabel: CsI18n.t('Operations'),
        panelID: "operations",
    },
    {
        id: "scheduler",
        content: CsI18n.t('Scheduler'),
        accessibilityLabel: CsI18n.t('Scheduler'),
        panelID: "scheduler"
    },
    {
        id: "feeds",
        content: CsI18n.t('Feeds'),
        accessibilityLabel: CsI18n.t('Feeds'),
        panelID: "feeds",
    },
    {
        id: "failures",
        content: CsI18n.t('Failures'),
        accessibilityLabel: CsI18n.t('Failures'),
        panelID: "failures"
    },
];
