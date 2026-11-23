export interface VietnamBankItem {
  bin: string;
  shortName: string;
  name: string;
}

export const VIETNAM_BANKS: VietnamBankItem[] = [
  { bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại thương Việt Nam (VCB)' },
  { bin: '970422', shortName: 'MBBank', name: 'Ngân hàng TMCP Quân đội (MB)' },
  { bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam (TCB)' },
  { bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam (CTG)' },
  { bin: '970418', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { bin: '970416', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu' },
  { bin: '970432', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { bin: '970423', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong' },
  { bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { bin: '970405', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
  { bin: '970437', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM' },
  { bin: '970441', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam' },
  { bin: '970448', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông' },
  { bin: '970426', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam' },
  { bin: '970443', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' },
  { bin: '970431', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam' },
  { bin: '970454', shortName: 'VietCapitalBank', name: 'Ngân hàng TMCP Bản Việt (BVBank)' },
  { bin: '970429', shortName: 'SCB', name: 'Ngân hàng TMCP Sài Gòn' },
  { bin: '970449', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam' },
  { bin: '970438', shortName: 'BaoVietBank', name: 'Ngân hàng TMCP Bảo Việt' },
  { bin: '970414', shortName: 'OceanBank', name: 'Ngân hàng TMCP Đại Dương' },
  { bin: '970452', shortName: 'KienlongBank', name: 'Ngân hàng TMCP Kiên Long' },
  { bin: '963388', shortName: 'Timo', name: 'Ngân hàng số Timo by BVBank' },
];

export function findBankByBin(bin?: string | null): VietnamBankItem | undefined {
  if (!bin) return undefined;
  return VIETNAM_BANKS.find((b) => b.bin === bin);
}
