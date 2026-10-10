const fs=require('node:fs/promises'),path=require('node:path'),sharp=require('sharp');
const {evidenceInput}=require('../dist/evidence');
const root=path.resolve(__dirname,'../../Milestone-1-Test-Uploads');
const files=[
 ['01-owner-id.jpg','OWNER_ID','Synthetic Owner 001 - TEST ID 0001'],
 ['03-vehicle-front.jpg','VEHICLE_FRONT','Front view'],['04-vehicle-rear.jpg','VEHICLE_REAR','Rear view'],
 ['05-vehicle-left.jpg','VEHICLE_LEFT','Left view'],['06-vehicle-right.jpg','VEHICLE_RIGHT','Right view'],
 ['07-chassis-number.jpg','CHASSIS_PHOTO','Chassis AG-M1-TEST-0001'],['08-number-plate.jpg','PLATE_PHOTO','Plate AG-TEST-001'],
 ...[1,2,3,4].map(n=>[`${String(8+n).padStart(2,'0')}-seal-position-${n}.jpg`,'SEAL_FITTING_PHOTO',`Seal position ${n} - no issued ID implied`]),
];
function pdf(lines){
 const stream='BT /F1 18 Tf 45 780 Td '+lines.map((s,n)=>(n?'0 -35 Td ':'')+'('+s.replace(/[\\()]/g,'\\$&')+') Tj').join('\n')+' ET';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',`<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`];
 let out='%PDF-1.4\n',offsets=[0];for(let n=0;n<objects.length;n++){offsets.push(Buffer.byteLength(out));out+=`${n+1} 0 obj\n${objects[n]}\nendobj\n`;}
 const xref=Buffer.byteLength(out);out+=`xref\n0 6\n0000000000 65535 f \n`+offsets.slice(1).map(n=>String(n).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;return Buffer.from(out);
}
async function main(){
 await fs.mkdir(path.join(root,'Negative-tests'),{recursive:true});const manifest=[];
 for(const [name,kind,label] of files){
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="650"><rect width="1000" height="650" fill="#ffffff"/><rect x="30" y="30" width="940" height="590" fill="#f5f7fa" stroke="#142b4a"/><text x="60" y="105" font-family="sans-serif" font-size="36" fill="#142b4a">AutoGuardian - SYNTHETIC TEST ONLY</text><text x="60" y="190" font-family="sans-serif" font-size="26" fill="#172033">${label}</text><text x="60" y="275" font-family="sans-serif" font-size="24">Vehicle AG-M1-TEST-0001 / AG-TEST-001</text><text x="60" y="380" font-family="sans-serif" font-size="25" fill="#b42318">NOT A REAL DOCUMENT, VEHICLE OR FITTED SEAL</text><text x="60" y="470" font-family="sans-serif" font-size="22">Fixture: ${name}</text></svg>`;
  const bytes=await sharp(Buffer.from(svg)).jpeg({quality:85}).toBuffer();await fs.writeFile(path.join(root,name),bytes);
  const validated=await evidenceInput({kind,dataBase64:bytes.toString('base64')});manifest.push({file:name,kind,bytes:bytes.length,normalizedSha256:validated.sha});
 }
 for(const [name,kind,title] of [['02-registration-document.pdf','REGISTRATION_DOCUMENT','REGISTRATION DOCUMENT TEST'],['Optional-purchase-proof.pdf','PURCHASE_PROOF','PURCHASE PROOF TEST']]){
  const bytes=pdf(['AutoGuardian - SYNTHETIC TEST ONLY',title,'Owner: Synthetic Owner 001','Test ID: TEST ID 0001','Vehicle: AG-M1-TEST-0001','Plate: AG-TEST-001','Not an official document or proof of ownership.']);
  await fs.writeFile(path.join(root,name),bytes);const v=await evidenceInput({kind,dataBase64:bytes.toString('base64')});manifest.push({file:name,kind,bytes:bytes.length,normalizedSha256:v.sha});
 }
 if(new Set(manifest.map(f=>f.normalizedSha256)).size!==manifest.length)throw new Error('Positive fixtures must have distinct normalized contents');
 await fs.copyFile(path.join(root,'09-seal-position-1.jpg'),path.join(root,'Negative-tests','duplicate-seal-photo.jpg'));
 await fs.writeFile(path.join(root,'Negative-tests','invalid-document.pdf'),'SYNTHETIC INVALID FILE - this is not a PDF');
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify({syntheticOnly:true,vehicle:{chassisIdentifier:'AG-M1-TEST-0001',plate:'AG-TEST-001',category:'CAR'},files:manifest},null,2)+'\n');
 console.log(`Prepared and validated ${manifest.length} synthetic upload files in Milestone-1-Test-Uploads.`);
}
void main().catch(e=>{console.error(e.message);process.exitCode=1;});
