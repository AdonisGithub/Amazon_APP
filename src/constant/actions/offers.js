import CsI18n from "../../components/csI18n";

export const offerTabs = [
    {
        id: 'export',
        content: CsI18n.t('Export'),
        name: 'export',
    },
    {
        id: 'import',
        content: CsI18n.t('Import'),
        name: 'import',
        feature: 'advanced_product_import',
    },
    {
        id: 'match',
        content: CsI18n.t('Match'),
        name: 'match'
    },
    {
        id: 'lookup',
        content: CsI18n.t('Lookup'),
        name: 'lookup'
    },
    {
        id: 'search',
        content: CsI18n.t('Search'),
        name: 'search'
    },
    {
        id: 'upload',
        content: CsI18n.t('Upload'),
        name: 'upload'
    },
    {
        id: 'image',
        content: CsI18n.t('Images'),
        name: 'image'
    },
    {
        id: 'translate',
        content: CsI18n.t('Translate'),
        name: 'translate'
    },
];
