import CsI18n from "../../components/csI18n";


const SOLVED_TYPE_EDIT_ATTRIBUTE = 'edit_attribute';
const SOLVED_TYPE_Confirm_ASIN = 'confirm_asin';
const SOLVED_TYPE_SOLVED = 'solved';
const SOLVED_TYPE_OVERRIDE = 'override';
const SOLVED_TYPE_RECREATE = 'recreate';
const SOLVED_TYPE_NONE = '';
export const ERROR_ACTION_TYPE = {
    Edit_Attribute: 'edit_attribute',
    Confirm_ASIN: 'confirm_asin',
    Solved: 'solved',
    Override: 'override',
    Recreate: 'recreate',
}

export const feedTabs = [
    {
        id: 'all',
        accessibilityLabel: CsI18n.t('All'),
        content: CsI18n.t('All'),
        panelID: 'all',
    },
    {
        id: 'product_errors',
        accessibilityLabel: CsI18n.t('Product Errors'),
        content: CsI18n.t('Product Errors'),
        panelID: 'product_errors',
    },
    {
        id: 'offer_errors',
        accessibilityLabel: CsI18n.t('Offer Errors'),
        content: CsI18n.t('Offer Errors'),
        panelID: 'offer_errors',
    },
];
