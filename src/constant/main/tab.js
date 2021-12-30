import CsI18n from "../../components/csI18n";

export const pageLabels = {
    welcome: {
        name: 'Welcome',
        help_text: "How to use {{help_link}} Tab?",
    },
    dashboard: {
        name: 'Dashboard',
        help_text: "How to use {{help_link}} Tab?",
    },
    actions: {
        name: 'Actions',
        help_text: "How to use {{help_link}} Tab?",
    },
    reports: {
        name: 'Reports',
        help_text: "How to use {{help_link}} Tab?",
    },
    // roadmap: {
    //     name: 'Roadmap',
    //     help_text: "How to use {{help_link}} Tab?",
    // },
    admin: {
        name: 'Admin',
        help_text: "How to use {{help_link}} Tab?",
    },
    help: {
        name: 'Help',
        help_text: "How to use {{help_link}} Tab?",
    },
    support: {
        name: 'Support',
        help_text: "How to use {{help_link}} Tab?",
    },
    connect: {
        name: 'Connect',
        help_text: "How to configure your {{help_link}} ?",
    },
    workflow: {
        name: 'Workflow',
        help_text: "How to configure your {{help_link}} ?",
    },
    rules: {
        name: 'Rules',
        help_text: "How to configure your {{help_link}} ?",
    },
    models: {
        name: 'Models',
        help_text: "How to configure your {{help_link}} ?",
    },
    sample: {
        name: 'Sample',
        help_text: "How to configure your {{help_link}} ?",
    }
};

export const mainTabs = [
    {
        id: "Dashboard",
        content: CsI18n.t('Dashboard'),
        accessibilityLabel: CsI18n.t('Dashboard'),
        panelID: "Dashboard",
        feature: 'any',
    },{
        id: "Connect",
        content: CsI18n.t('Connect'),
        accessibilityLabel: CsI18n.t('Connect'),
        panelID: "Connect",
        feature: 'any',
    },{
        id: "Workflow",
        content: CsI18n.t('Workflow'),
        accessibilityLabel: CsI18n.t('Workflow'),
        panelID: "Workflow",
        feature: 'any',
    },{
        id: "Rules",
        content: CsI18n.t('Rules'),
        accessibilityLabel: CsI18n.t('Rules'),
        panelID: "Rules",
        feature: 'any',
    },{
        id: "Models",
        content: CsI18n.t('Models'),
        accessibilityLabel: CsI18n.t('Models'),
        panelID: "Models",
        feature: 'any',
    },{
        id: "Actions",
        content: CsI18n.t('Actions'),
        accessibilityLabel: CsI18n.t('Actions'),
        panelID: "Actions",
        feature: 'any'
    },{
        id: "Reports",
        content: CsI18n.t('Reports'),
        accessibilityLabel: CsI18n.t('Reports'),
        panelID: "Reports",
        feature: 'any'
    },{
        id: "Help",
        content: CsI18n.t('Help'),
        accessibilityLabel: CsI18n.t('Help'),
        panelID: "Help",
        feature: 'any'
    },
    {
        id: "Support",
        content: CsI18n.t('Support'),
        accessibilityLabel: CsI18n.t('Support'),
        panelID: "Support",
        feature: 'any'
    }/*, {
        id: "Roadmap",
        content: CsI18n.t('Roadmap'),
        accessibilityLabel: CsI18n.t('Roadmap'),
        panelID: "Roadmap",
        feature: 'any'
    }*/
];

