  const brand = (name, sku) => {
    const s = (sku || '').toUpperCase().trim();
    const n = (name || '').toLowerCase();
    if (s.startsWith('DHN') || s.startsWith('DHT')) return 'DAH Solar';
    if (s.includes('LR8-66HGD')) return 'Longi';
    if (s.includes('JAM72D40')) return 'JA Solar';
    if (['J12100LY','J24100','J12100','J12200','J24230','BG48100'].some(p => s.includes(p))) return 'JSDSolar';
    if (['BX51100','DL5.0C','POWERBRICK','S51100','SBDU','HV4F','BDU_HV4F','HUB_HV4F','BR_11SHV4F'].some(p => s.includes(p)) || n.includes('dyness')) return 'Dyness';
    if (s.startsWith('FF') || s.includes('F132') || n.includes('flashfish')) return 'FlashFish';
    if (['HSI_3500','HSI_5500','SP-ESS','J3000L-24','J5500HP','51_2V100','24V200AH','J24230'].some(p => s.includes(p)) || n.includes('agent')) return 'AGENT';
    if (['SUN-','BOS-G','BOS-A','GB-S','GB-L','MGB-L','SE-G','SE-F','RW-M','RW-F','AI-W5.1','AE-F2.0','GE-F','ASM20','ASM02','HVB750','3U-HRACK','3U-LRACK','BOS-GM5.1','BOS-G-PDU','BOS-A-PDU','BOS-A-RACK','GB-SL','GB-L-HVCBWS','GB-L-BB','DEYE','SUN M1000','BK01'].some(p => s.includes(p)) || n.includes('deye')) return 'Deye';
    if (n.includes('longi')) return 'Longi';
    if (n.includes('ja solar')) return 'JA Solar';
    if (n.includes('ecoflow')) return 'EcoFlow';
    return '';
  };