import CsI18n from "../../components/csI18n";

export const modelTabs = [
  {
    id: "matchingGroups",
      content: CsI18n.t('Matching groups'),
      accessibilityLabel: CsI18n.t('Matching groups'),
    panelID: "matchingGroups"
  },{
    id: "models",
    content: CsI18n.t('Models'),
    accessibilityLabel: CsI18n.t('Models'),
    panelID: "models"
  },{
    id: "metafields",
        content: CsI18n.t('Overrides'),
        accessibilityLabel: CsI18n.t('Overrides'),
    panelID: "metafields"
  },{
    id: "mappings",
    content: CsI18n.t('Mappings'),
    accessibilityLabel: CsI18n.t('Mappings'),
    panelID: "mappings"
  }
];

