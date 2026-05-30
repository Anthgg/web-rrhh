const fs = require('fs');
const files = [
  'src/components/settings/company/CompanyAssetUploader.tsx',
  'src/components/requests/RequestDetailModal.tsx',
  'src/components/requests/RequestFormModal.tsx',
  'src/components/requests/NewRequestForm.tsx',
  'src/components/settings/company/OfficialFileCard.tsx',
  'src/components/settings/company/CompanyDocumentPreview.tsx',
  'src/components/settings/company/CorporatePreview.tsx',
  'src/components/dashboard/birthdays/BirthdayCalendarModal.tsx',
  'src/components/dashboard/birthdays/UpcomingBirthdaysList.tsx'
];
let changed = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes('<img') || content.includes('<img ')) {
    let newContent = content.replace(/<img/g, '<Image unoptimized width={400} height={400}');
    if (!newContent.includes('import Image from')) {
       newContent = 'import Image from "next/image";\n' + newContent;
    }
    fs.writeFileSync(f, newContent, 'utf8');
    changed++;
  }
});
console.log('Fixed img in ' + changed + ' files.');
