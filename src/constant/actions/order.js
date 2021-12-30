import CsI18n from "../../components/csI18n";

export const ordersTabs = [
    {
        id: 'importable',
        accessibilityLabel: CsI18n.t('Importable'),
        content: CsI18n.t('Importable'),
        panelID: 'importable',
    },
    {
        id: 'imported',
        accessibilityLabel: CsI18n.t('Imported'),
        content: CsI18n.t('Imported'),
        panelID: 'imported',
    },
    {
        id: 'fulfillment',
        accessibilityLabel: CsI18n.t('Fulfillment'),
        content: CsI18n.t('Fulfillment'),
        panelID: 'fulfillment',
    }
];
