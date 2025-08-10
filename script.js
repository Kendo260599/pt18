// script.js - cập nhật: bỏ dòng ghi chú năm sinh hiệu lực trong kết quả

// ============== Parse ngày & quy tắc năm sinh hiệu lực ==============
function parseDateParts(dateStr){
  if(!dateStr || typeof dateStr!=='string') throw new Error('Ngày sinh không hợp lệ');
  const s = dateStr.trim();
  const sep = s.includes('-')?'-':(s.includes('/')?'/':null);
  if(!sep) throw new Error('Định dạng ngày phải có "-" hoặc "/" (ví dụ 1992-03-13 hoặc 13/03/1992)');
  const parts = s.split(sep).map(x=>parseInt(x,10));
  if(parts.length!==3 || parts.some(isNaN)) throw new Error('Định dạng ngày không đúng');
  // Nếu phần đầu > 31 -> coi là YYYY-MM-DD, ngược lại coi là DD/MM/YYYY
  if(parts[0] > 31){
    return {year:parts[0], month:parts[1], day:parts[2]};
  }else{
    return {year:parts[2], month:parts[1], day:parts[0]};
  }
}

// Quy tắc tính năm sinh hiệu lực dựa trên cắt ngày 13/03
// Bạn có thể thay đổi AGE_RULE.cutoffMonth và AGE_RULE.cutoffDay nếu quy tắc của bạn khác
const AGE_RULE = {
  mode: 'image',      // 'image' hoặc 'classic'
  cutoffMonth: 3,     // tháng cắt (ví dụ: 3 cho tháng 3)
  cutoffDay: 13       // ngày cắt (ví dụ: 13)
};

function getEffectiveBirthYear(birthDateString){
  const {year, month, day} = parseDateParts(birthDateString);
  if (AGE_RULE.mode === 'image') {
    if (month < AGE_RULE.cutoffMonth || (month === AGE_RULE.cutoffMonth && day <= AGE_RULE.cutoffDay)) {
      return year - 1;
    }
    return year;
  }
  // Classic rule (if mode is not 'image' or other specified mode)
  if (month < 3 || (month === 3 && day <= 13)) return year - 1;
  return year;
}

// 3) Cung mệnh theo bảng ảnh (chu kỳ 9 năm)
const ZODIAC = ['Tý','Sửu','Dần','Mão','Thìn','Tỵ','Ngọ','Mùi','Thân','Dậu','Tuất','Hợi'];
function idxZodiac(y){ return ((y-4)%12+12)%12; }
function nameZodiac(y){ return ZODIAC[idxZodiac(y)]; }
function nameByIndex(i){ return ZODIAC[i]; }

const MALE_START = 1921; // Năm bắt đầu chu kỳ cho nam theo bảng
const FEMALE_START = 1922; // Năm bắt đầu chu kỳ cho nữ theo bảng

// Chuỗi cung và số theo bảng cho Nam (chu kỳ 9 năm)
const MALE_CUNG_SEQ = ['Đoài','Càn','Khôn','Tốn','Chấn','Khôn','Khảm','Ly','Cấn'];
const MALE_SO_SEQ   = [7,6,5,4,3,2,1,9,8];

// Chuỗi cung và số theo bảng cho Nữ (chu kỳ 9 năm)
const FEMALE_CUNG_SEQ = ['Cấn','Khảm','Ly','Tốn','Chấn','Khôn','Càn','Đoài','Cấn'];
const FEMALE_SO_SEQ   = [2,1,9,8,7,6,5,4,3];

function mod9(n){ return ((n % 9) + 9) % 9; } // Helper để tính modulo 9, trả về 0-8

function getCungMenh(birthDateString, gender){
  const effectiveYear = getEffectiveBirthYear(birthDateString);
  let idx, cung, so;

  if(gender === 'nam'){
    idx  = mod9(effectiveYear - MALE_START); // Tính chỉ số trong chu kỳ 9 năm
    cung = MALE_CUNG_SEQ[idx];
    so   = MALE_SO_SEQ[idx];
  }else{ // gender === 'nu'
    idx  = mod9(effectiveYear - FEMALE_START);
    cung = FEMALE_CUNG_SEQ[idx];
    so   = FEMALE_SO_SEQ[idx];
  }

  const CUNG_INFO = { // Mapping Cung -> Ngũ hành, Hướng
    'Càn':  { nguyenTo:'Kim',  huong:'Tây Bắc' },
    'Khôn': { nguyenTo:'Thổ',  huong:'Tây Nam' },
    'Cấn':  { nguyenTo:'Thổ',  huong:'Đông Bắc' },
    'Chấn': { nguyenTo:'Mộc',  huong:'Đông' },
    'Tốn':  { nguyenTo:'Mộc',  huong:'Đông Nam' },
    'Ly':   { nguyenTo:'Hỏa',  huong:'Nam' },
    'Khảm': { nguyenTo:'Thủy', huong:'Bắc' },
    'Đoài': { nguyenTo:'Kim',  huong:'Tây' }
  };
  const {nguyenTo, huong} = CUNG_INFO[cung];
  const DONG_TU = ['Khảm','Ly','Chấn','Tốn'];
  const nhomTrach = DONG_TU.includes(cung) ? 'Đông Tứ Trạch' : 'Tây Tứ Trạch';

  // Lấy chi (con giáp) của năm sinh hiệu lực
  const ownerChiIndex = idxZodiac(effectiveYear);
  const ownerChiName = ZODIAC[ownerChiIndex];

  return { effectiveYear, so, cung, nhomTrach, nguyenTo, huong, ownerChiIndex, ownerChiName };
}

// 4) Bát Trạch: mapping 8 hướng tốt/xấu theo từng Cung
function getBatTrachForCung(cung){
  const C = {
    good:{
      'Sinh Khí':{ten:'Sinh Khí',loai:'good',y:'Tài lộc, danh tiếng, thăng tiến, vượng khí.'},
      'Thiên Y': {ten:'Thiên Y', loai:'good',y:'Sức khỏe, trường thọ, quý nhân.'},
      'Diên Niên':{ten:'Diên Niên',loai:'good',y:'Hòa thuận, bền vững quan hệ.'},
      'Phục Vị': {ten:'Phục Vị', loai:'good',y:'Ổn định, thi cử, phát triển bản thân.'}
    },
    bad:{
      'Tuyệt Mệnh':{ten:'Tuyệt Mệnh',loai:'bad',y:'Nặng nhất: tổn hại lớn, bệnh tật, phá sản.'},
      'Ngũ Quỷ':   {ten:'Ngũ Quỷ',   loai:'bad',y:'Thị phi, mất mát, tranh cãi.'},
      'Lục Sát':   {ten:'Lục Sát',   loai:'bad',y:'Kiện tụng, tai nạn, bất hòa.'},
      'Họa Hại':   {ten:'Họa Hại',   loai:'bad',y:'Xui xẻo, thất bại nhỏ lẻ.'}
    }
  };
  const B = { // Bảng tra cứu theo Cung
    'Khảm': {'Đông Nam':C.good['Sinh Khí'],'Đông':C.good['Thiên Y'],'Nam':C.good['Diên Niên'],'Bắc':C.good['Phục Vị'],'Tây Nam':C.bad['Tuyệt Mệnh'],'Đông Bắc':C.bad['Ngũ Quỷ'],'Tây Bắc':C.bad['Lục Sát'],'Tây':C.bad['Họa Hại']},
    'Ly':   {'Đông':C.good['Sinh Khí'],'Đông Nam':C.good['Thiên Y'],'Bắc':C.good['Diên Niên'],'Nam':C.good['Phục Vị'],'Tây Bắc':C.bad['Tuyệt Mệnh'],'Tây':C.bad['Ngũ Quỷ'],'Tây Nam':C.bad['Lục Sát'],'Đông Bắc':C.bad['Họa Hại']},
    'Chấn': {'Nam':C.good['Sinh Khí'],'Bắc':C.good['Thiên Y'],'Đông Nam':C.good['Diên Niên'],'Đông':C.good['Phục Vị'],'Tây':C.bad['Tuyệt Mệnh'],'Tây Bắc':C.bad['Ngũ Quỷ'],'Đông Bắc':C.bad['Lục Sát'],'Tây Nam':C.bad['Họa Hại']},
    'Tốn':  {'Bắc':C.good['Sinh Khí'],'Nam':C.good['Thiên Y'],'Đông':C.good['Diên Niên'],'Đông Nam':C.good['Phục Vị'],'Đông Bắc':C.bad['Tuyệt Mệnh'],'Tây Nam':C.bad['Ngũ Quỷ'],'Tây':C.bad['Lục Sát'],'Tây Bắc':C.bad['Họa Hại']},
    'Càn':  {'Tây':C.good['Sinh Khí'],'Đông Bắc':C.good['Thiên Y'],'Tây Nam':C.good['Diên Niên'],'Tây Bắc':C.good['Phục Vị'],'Nam':C.bad['Tuyệt Mệnh'],'Đông':C.bad['Ngũ Quỷ'],'Bắc':C.bad['Lục Sát'],'Đông Nam':C.bad['Họa Hại']},
    'Khôn': {'Đông Bắc':C.good['Sinh Khí'],'Tây':C.good['Thiên Y'],'Tây Bắc':C.good['Diên Niên'],'Tây Nam':C.good['Phục Vị'],'Bắc':C.bad['Tuyệt Mệnh'],'Đông Nam':C.bad['Ngũ Quỷ'],'Nam':C.bad['Lục Sát'],'Đông':C.bad['Họa Hại']},
    'Cấn':  {'Tây Nam':C.good['Sinh Khí'],'Tây Bắc':C.good['Thiên Y'],'Tây':C.good['Diên Niên'],'Đông Bắc':C.good['Phục Vị'],'Đông Nam':C.bad['Tuyệt Mệnh'],'Bắc':C.bad['Ngũ Quỷ'],'Đông':C.bad['Lục Sát'],'Nam':C.bad['Họa Hại']},
    'Đoài': {'Tây Bắc':C.good['Sinh Khí'],'Tây Nam':C.good['Thiên Y'],'Đông Bắc':C.good['Diên Niên'],'Tây':C.good['Phục Vị'],'Đông':C.bad['Tuyệt Mệnh'],'Nam':C.bad['Ngũ Quỷ'],'Đông Nam':C.bad['Lục Sát'],'Bắc':C.bad['Họa Hại']}
  };
  return B[cung];
}

// Hàm phân tích hướng theo cung mệnh (Bát Trạch)
function analyzeHouseDirection(cungObj, huongNha){
  const table = getBatTrachForCung(cungObj.cung);
  const all = Object.entries(table).map(([huong,info])=>({huong, ...info}));
  const selected = table[huongNha];
  const goods = all.filter(x=>x.loai==='good');
  const bads  = all.filter(x=>x.loai==='bad');
  return {selected, goods, bads, all};
}
// Gợi ý hóa giải chung theo loại hướng (tốt/xấu)
function adviceForDirectionClass(cls){
  if(!cls) return [];
  if(cls==='good') return [
    'Ưu tiên cửa chính/ban công theo hướng này.',
    'Bếp, bàn thờ, giường, bàn làm việc xoay về 1 trong 4 hướng tốt.',
    'Giữ lối vào thông thoáng, sạch sẽ.'
  ];
  return [
    'Dùng bình phong/hiên/bậc tam cấp để “bẻ dòng khí xấu”.',
    'Bố trí nội thất “tọa hung – hướng cát”.',
    'Treo Bát Quái lồi ngoài cổng (cân nhắc).',
    'Tăng cây xanh, ánh sáng, nước/đá trang trí để điều hòa khí.'
  ];
}

// ============== 12 con giáp, Tam Tai, Kim Lâu, Hoang Ốc, Xung tuổi, Ngũ hành ==============
function checkTamTai(ownerYear, constructionYear){
  const ownerChi = nameZodiac(ownerYear);
  const cChi     = nameZodiac(constructionYear);
  const g = TAM_TAI_GROUPS.find(x=>x.group.includes(ownerChi));
  const isTamTai = g ? g.tamTai.includes(cChi) : false;
  return {isTamTai, ownerChi, constructionChi:cChi, tamTaiList:g?g.tamTai:[]};
}
function tuoiMu(effectiveBirthYear, constructionYear){
  return constructionYear - effectiveBirthYear + 1;
}
function checkKimLau(tuoiMuVal){
  let r = tuoiMuVal % 9; if(r===0) r=9;
  const types = {1:'Kim Lâu Thân',3:'Kim Lâu Thê',6:'Kim Lâu Tử',8:'Kim Lâu Lục Súc'};
  const isKimLau = [1,3,6,8].includes(r);
  return {isKimLau, type:isKimLau?types[r]:null, remainder:r};
}
function checkHoangOc(tuoiMuVal){
  const labels = ['Nhất Cát','Nhì Nghi','Tam Địa Sát','Tứ Tấn Tài','Ngũ Thọ Tử','Lục Hoang Ốc'];
  const m = tuoiMuVal % 6; const idx = (m===0)?5:m-1;
  const name = labels[idx];
  const isBad = ['Tam Địa Sát','Ngũ Thọ Tử','Lục Hoang Ốc'].includes(name);
  return {name, isBad};
}
function checkXungTuoi(ownerYear, constructionYear){
  const opp = (idxZodiac(ownerYear)+6)%12;
  const isXung = idxZodiac(constructionYear)===opp;
  return {isXung, ownerChi:nameZodiac(ownerYear), constructionChi:nameZodiac(constructionYear), oppositeChi:nameZodiac(opp)};
}
function elementYear(year){
  const s = ((year-4)%10+10)%10;
  if(s===0||s===1) return 'Mộc';
  if(s===2||s===3) return 'Hỏa';
  if(s===4||s===5) return 'Thổ';
  if(s===6||s===7) return 'Kim';
  return 'Thủy';
}
function elementMonth(month){
  const m = Number(month);
  if([1,6,11].includes(m)) return 'Thủy';
  if([2,7,12].includes(m)) return 'Hỏa';
  if([3,8].includes(m)) return 'Thổ';
  if([4,9].includes(m)) return 'Kim';
  if([5,10].includes(m)) return 'Mộc';
  return null;
}
const KHAC = {'Mộc':'Thổ','Thổ':'Thủy','Thủy':'Hỏa','Hỏa':'Kim','Kim':'Mộc'};
function isElementConflict(e1,e2){
  if(!e1 || !e2) return false;
  return (KHAC[e1] === e2) || (KHAC[e2] === e1);
}

// Yếu tố xấu BĐS & hóa giải
function checkSiteIssues(features){
  const problems=[]; const solutions=[];
  if(features.includes('benh-vien')){
    problems.push('Trước mặt Bệnh viện: âm khí nặng, ảnh hưởng trường khí & sức khỏe.');
    solutions.push('Tăng cây xanh, rèm dày, chiếu sáng tốt; cân nhắc Bát Quái lồi ngoài cổng; đặt tượng Di Lặc tăng dương khí.');
  }
  if(features.includes('chua') || features.includes('nha-tho')){
    problems.push('Đối diện Chùa/Nhà thờ: khí tĩnh/âm mạnh, dễ ảnh hưởng tài khí.');
    solutions.push('Đặt Quan Công gần cửa, chuông gió kim loại, cây Kim Ngân/Trầu bà; hạn chế cửa nhìn thẳng cơ sở tâm linh.');
  }
  if(features.includes('truong-hoc')){
    problems.push('Đối diện Trường học: ồn ào, khí động mạnh, ảnh hưởng nghỉ ngơi.');
    solutions.push('Hàng rào/vách ngăn/rèm cách âm; bố trí phòng ngủ lùi sâu; tăng cây xanh.');
  }
  if(features.includes('duong-dam')){
    problems.push('Đường đâm thẳng vào nhà: sát khí trực xung, hao tài.');
    solutions.push('Bình phong/tiểu cảnh trước cửa, cây to, bậc tam cấp “gãy dòng”; cân nhắc Bát Quái lồi.');
  }
  if(features.includes('nga-ba') || features.includes('nga-tu')){
    problems.push('Nhà tại Ngã ba/Ngã tư: khí loạn, bất ổn, khó tụ tài.');
    solutions.push('Cổng kín/hàng rào; hồ cá/đá/đèn cân bằng; sảnh/hiên che chắn; cân nhắc cửa phụ.');
  }
  if(features.includes('duong-doc')){
    problems.push('Đường dốc trước nhà: khí trượt, khó tụ.');
    solutions.push('Bậc thềm, ốp đá nhám, bồn cây bậc cấp; ưu tiên cửa lệch/bình phong.');
  }
  if(features.includes('cot-dien')){
    problems.push('Cột điện gần cổng/nhà: sát khí, từ trường xấu.');
    solutions.push('Lùi cổng/cửa; cây cao che chắn; đá hộ mệnh (thạch anh); tránh kê giường sát tường phía cột.');
  }
  return {problems, solutions};
}

// ============== Tổng hợp đánh giá (Cung mệnh, Tuổi, Hướng, BĐS) ==============
function evaluateAll(birthDate, gender, huongNha, constructionYear, constructionMonth, features){
  // 1. Phân tích Cung mệnh Bát Trạch
  const cung = getCungMenh(birthDate, gender);
  const age = tuoiMu(cung.effectiveYear, constructionYear);

  const kimLau = checkKimLau(age);
  const hoangOc = checkHoangOc(age);
  const tamTai = checkTamTai(cung.ownerChiIndex, constructionYear);
  const xung = checkXungTuoi(cung.ownerChiIndex, constructionYear);

  const yearElement = elementYear(constructionYear);
  const monthElement = elementMonth(constructionMonth);
  const conflictYear = isElementConflict(cung.nguyenTo, yearElement);
  const conflictMonth = isElementConflict(cung.nguyenTo, monthElement);

  const yearWarnings=[];
  if(kimLau.isKimLau) yearWarnings.push(`Phạm Kim Lâu (${kimLau.type}) — tuổi mụ ${age}.`);
  if(hoangOc.isBad)   yearWarnings.push(`Phạm Hoang Ốc (${hoangOc.name}).`);
  if(tamTai.isTamTai) yearWarnings.push(`Phạm Tam Tai (${tamTai.constructionChi}); chu kỳ Tam Tai: ${tamTai.tamTaiList.join(', ')}.`);
  if(xung.isXung)     yearWarnings.push(`Xung tuổi với năm ${constructionYear} (năm ${xung.constructionChi} đối xung ${xung.oppositeChi}).`);
  if(conflictYear)    yearWarnings.push(`Ngũ hành Cung (${cung.nguyenTo}) khắc Ngũ hành Năm (${yearElement}).`);

  const monthWarnings=[];
  if(conflictMonth)   monthWarnings.push(`Tháng ${constructionMonth}: Cung (${cung.nguyenTo}) khắc tháng (${monthElement}).`);

  // 2. Phân tích Hướng nhà theo Cung Mệnh Bát Trạch
  const dir = analyzeHouseDirection(cung, huongNha);

  // 3. Phân tích theo Cung Phi Bát Quái (từ tuổi)
  const phi = getCungMenh(birthDate, gender); // Lấy lại cung phi theo cách tính mới
  const dirPhi = analyzeHouseDirection(phi, huongNha); // Phân tích hướng theo cung phi

  // 4. Phân tích yếu tố xấu BĐS
  const site = checkSiteIssues(features);

  return { build:{cung, ageMu:age, kimLau, hoangOc, tamTai, xung, yearElement, monthElement, yearWarnings, monthWarnings, isYearGood:yearWarnings.length===0, isMonthGood:monthWarnings.length===0}, dir, phi, dirPhi, site };
}

// ============== UI Hook: xử lý sự kiện nút bấm ==============
document.addEventListener('DOMContentLoaded', ()=>{
  const btn = document.getElementById('btn-analyze');
  if(!btn) return;

  btn.addEventListener('click', ()=>{
    try{
      const birth   = document.getElementById('ngay-sinh').value.trim();
      const gender  = document.getElementById('gioi-tinh').value;
      const huong   = document.getElementById('huong-nha').value;
      const yearX   = parseInt(document.getElementById('nam-xay').value,10);
      const monthX  = parseInt(document.getElementById('thang-xay').value,10);
      const features= Array.from(document.querySelectorAll('input[name="location-feature"]:checked')).map(c=>c.value);

      if(!birth) return alert('Vui lòng nhập ngày sinh (YYYY-MM-DD hoặc DD/MM/YYYY).');
      if(!yearX || yearX<1900 || yearX>2099) return alert('Vui lòng nhập năm xây hợp lệ (1900–2099).');
      if(!monthX || monthX<1 || monthX>12) return alert('Vui lòng chọn tháng xây (1–12).');

      const R = evaluateAll(birth, gender, huong, yearX, monthX, features);
      const el = document.getElementById('result-content');
      let html = '';

      // 1) Cung mệnh (theo Bát Trạch)
      html += `<div class="ket-luan"><div><span class="badge">Cung mệnh</span> <strong>${R.build.cung.cung}</strong> — Ngũ hành: <strong>${R.build.cung.nguyenTo}</strong> — Nhóm: <strong>${R.build.cung.nhomTrach}</strong></div>`;
      // ĐÃ BỎ DÒNG NÀY: <div class="block-sub">Năm sinh hiệu lực: ${R.build.cung.effectiveYear} — Số (theo bảng): ${R.build.cung.so}</div>`;
      html += `</div>`;

      // 2) Cung phi bát quái (theo tuổi)
      html += `<div class="ket-luan" style="margin-top:10px"><div><span class="badge">Cung phi</span> <strong>${R.phi.cung}</strong> (số: ${R.phi.so})</div>`;
      html += `<div class="block-sub">Cung phi tính theo tuổi & giới tính (theo bảng tra).</div>`;
      html += `</div>`;

      // 3) Hướng nhà theo Cung mệnh Bát Trạch
      const sel = R.dir.selected;
      html += `<h3 class="block-title">Hướng nhà (theo Cung mệnh): ${huong} <span class="tag ${sel?.loai||'warn'}">${sel?sel.ten:'?'}</span></h3>`;
      if(sel){
        html += `<p><em>Ý nghĩa:</em> ${sel.y}</p>`;
        const adv = adviceForDirectionClass(sel.loai);
        if(adv.length){
          html += `<p><strong>Gợi ý:</strong></p><ul class="clean">`;
          adv.forEach(a=> html += `<li>${a}</li>`);
          html += `</ul>`;
        }
      }
      if(R.dir.goods?.length){
        html += `<p><strong>4 hướng tốt nên ưu tiên (theo Cung mệnh):</strong></p><ul class="clean">`;
        const priority = {'Sinh Khí':1,'Thiên Y':2,'Diên Niên':3,'Phục Vị':4};
        const gsort = [...R.dir.goods].sort((a,b)=> (priority[a.ten]||9)-(priority[b.ten]||9));
        gsort.forEach(g=> html += `<li><span class="good">${g.huong}</span> — ${g.ten}: ${g.y}</li>`);
        html += `</ul>`;
      }

      html += `<hr/>`;

      // 4) Năm/Tháng xây
      html += `<h3 class="block-title">Năm/Tháng xây</h3>`;
      html += `<p>Tuổi mụ: <strong>${R.build.ageMu}</strong> — Ngũ hành năm: <strong>${R.build.yearElement}</strong> — Ngũ hành tháng: <strong>${R.build.monthElement||'?'}</strong></p>`;
      if(R.build.yearWarnings.length===0) html += `<p class="good">Năm ${yearX}: Không thấy cảnh báo lớn.</p>`;
      else{
        html += `<p><strong>Cảnh báo năm ${yearX}:</strong></p><ul class="clean">`;
        R.build.yearWarnings.forEach(w=> html += `<li class="bad">${w}</li>`);
        html += `</ul>`;
      }
      if(R.build.monthWarnings.length===0) html += `<p class="good">Tháng ${monthX}: Không thấy cảnh báo lớn.</p>`;
      else{
        html += `<p><strong>Cảnh báo tháng ${monthX}:</strong></p><ul class="clean">`;
        R.build.monthWarnings.forEach(w=> html += `<li class="warn">${w}</li>`);
        html += `</ul>`;
      }

      html += `<hr/>`;

      // 5) Hướng nhà theo Cung Phi Bát Quái
      html += `<h3 class="block-title">Hướng nhà (theo Cung phi): ${huong}</h3>`;
      const phiSel = R.dirPhi.selected; // Lấy kết quả phân tích hướng theo cung phi
      if(phiSel){
        html += `<p>Hướng phi bagua tương ứng: <strong>${phiSel.ten}</strong> — ${phiSel.yNghia}</p>`;
      } else {
        html += `<p>Chưa xác định hướng phi bagua cho hướng này.</p>`;
      }
      // Gợi ý 4 hướng tốt theo phi bagua
      if(R.dirPhi.goods?.length){
        html += `<p><strong>4 hướng tốt theo phi bagua:</strong></p><ul class="clean">`;
        const priority = {'Sinh Khí':1,'Thiên Y':2,'Diên Niên':3,'Phục Vị':4};
        const gsort = [...R.dirPhi.goods].sort((a,b)=> (priority[a.ten]||9)-(priority[b.ten]||9));
        gsort.forEach(g=> html += `<li><span class="good">${g.huong}</span> — ${g.ten}: ${g.y}</li>`);
        html += `</ul>`;
      }

      // 6) Yếu tố bất động sản
      html += `<hr/><h3 class="block-title">Môi trường xung quanh BĐS</h3>`;
      if(R.site.problems.length===0){
        html += `<p class="good">Không phát hiện yếu tố xấu đã chọn.</p>`;
      }else{
        html += `<h4>Các vấn đề:</h4><ul class="clean">`;
        R.site.problems.forEach(p=> html += `<li class="bad">${p}</li>`);
        html += `</ul>`;
        html += `<h4>Cách hóa giải:</h4><ul class="clean">`;
        R.site.solutions.forEach(s=> html += `<li>${s}</li>`);
        html += `</ul>`;
      }

      el.innerHTML = html;
    }catch(err){
      console.error(err);
      alert('Lỗi: '+(err.message||err));
    }
  });
});