const fs = require('fs');
const path = require('path');

const files = [
    'server/src/routes/application.routes.ts',
    'server/src/controllers/applicationController.ts',
    'server/prisma/schema.prisma',
    'server/prisma/migrations/20260318044808_add_f2f_early_registration_fields/migration.sql',
    'client/src/router/index.tsx',
    'client/src/pages/settings/CurriculumTab.tsx',
    'client/src/pages/f2f-early-registration/Index.tsx',
    'client/src/pages/f2f-early-registration/F2FEarlyRegistrationSuccess.tsx',
    'client/src/pages/apply/types.ts',
    'client/src/pages/apply/PrivacyNotice.tsx',
    'client/src/pages/apply/EarlyRegistrationForm.tsx',
    'client/src/pages/apply/Index.tsx',
    'client/src/pages/apply/components/Step1Personal.tsx',
    'client/src/pages/apply/components/Step2Family.tsx',
    'client/src/pages/apply/components/Step3Background.tsx',
    'client/src/pages/apply/components/Step3Preferences.tsx',
    'client/src/pages/apply/components/Step4PreviousSchool.tsx',
    'client/src/pages/apply/components/Step5Enrollment.tsx',
    'client/src/pages/apply/components/Step6Review.tsx',
    'client/src/pages/apply/components/EarlyRegistrationSuccess.tsx',
    'client/src/pages/applications/early-registration/EarlyRegistrationList.tsx',
    'client/src/hooks/usePageTitle.ts'
];

const basePath = 'C:/Users/Admin/Documents/EnrollPro/enrollpro/';

files.forEach(file => {
    const fullPath = path.join(basePath, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');

    // 1. Initial cleanup: Remove incorrect spaces and casing from previous attempt
    // (This tries to restore identifiers to a reasonable Pascal/camel state)
    
    // Identifiers in router
    content = content.replace(/import\s+EARLY\s+REGISTRATION/g, 'import EarlyRegistration');
    content = content.replace(/import\s+Early\s+Registration/g, 'import EarlyRegistration');
    content = content.replace(/<EARLY\s+REGISTRATION\s*\/>/g, '<EarlyRegistration />');
    content = content.replace(/<Early\s+Registration\s*\/>/g, '<EarlyRegistration />');
    
    // Component name and usage in router
    content = content.replace(/const\s+router\s+=/g, 'export const router ='); // Just to preserve this
    
    // 2. PascalCase fixes
    content = content.replace(/Early\s+RegistrationSuccess/g, 'EarlyRegistrationSuccess');
    content = content.replace(/Early\s+RegistrationForm/g, 'EarlyRegistrationForm');
    content = content.replace(/Early\s+RegistrationList/g, 'EarlyRegistrationList');
    content = content.replace(/Early\s+RegistrationFormData/g, 'EarlyRegistrationFormData');
    content = content.replace(/Early\s+RegistrationChannel/g, 'EarlyRegistrationChannel');
    content = content.replace(/F2FEarly\s+Registration/g, 'F2FEarlyRegistration');
    content = content.replace(/Early\s+Registration/g, (match, offset, string) => {
        const nextChar = string[offset + match.length];
        const prevChar = offset > 0 ? string[offset - 1] : '';
        // If part of an identifier (e.g. Early RegistrationSchema)
        if (/[A-Z]/.test(nextChar) || /[a-z0-9]/.test(prevChar)) {
            return 'EarlyRegistration';
        }
        return match;
    });

    // 3. camelCase fixes
    content = content.replace(/early\s+RegistrationChannel/g, 'earlyRegistrationChannel');
    content = content.replace(/early\s+Registration/g, 'earlyRegistration');
    
    // 4. Schema specific fixes
    if (file.endsWith('schema.prisma')) {
       // Field name should be earlyRegistrationChannel
       content = content.replace(/EarlyRegistrationChannel\s+EarlyRegistrationChannel/g, 'earlyRegistrationChannel  EarlyRegistrationChannel');
       // Restore boxes
       content = content.replace(/â”€â”€/g, '──');
    }

    // 5. Audit Log fixes (usually string labels)
    content = content.replace(/EARLY\s+REGISTRATION/g, 'EARLY REGISTRATION');

    // 6. Router Navigate path
    content = content.replace(/Navigate\s+to="\/applications\/early\s+registration"/g, 'Navigate to="/applications/early-registration"');

    fs.writeFileSync(fullPath, content, 'utf8');
});
