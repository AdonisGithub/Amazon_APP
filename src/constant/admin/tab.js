import CsI18n from "../../components/csI18n";

export const adminTabs = [
    {
        id: "manage",
        content: CsI18n.t('Manage'),
        accessibilityLabel: CsI18n.t('Manage'),
        panelID: "manage"
    },
    {
        id: "log",
        content: CsI18n.t('Log'),
        accessibilityLabel: CsI18n.t('Log'),
        panelID: "log",
    },
];