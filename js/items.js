/**
 * items.js - Thai Mythological Dark Fantasy RPG Equipment & Inventory Engine
 * Manages item templates, procedural stat rolls, rarity tiers, and drop generators.
 */

const RARITY_TIERS = {
  common: {
    id: 'common',
    name: 'ธรรมดา',
    color: '#cbd5e1',
    bgColor: 'rgba(148, 163, 184, 0.12)',
    borderColor: '#94a3b8',
    glowColor: 'rgba(148, 163, 184, 0.35)',
    multiplier: 1.0,
    affixCount: 0,
    dropWeight: 60
  },
  magic: {
    id: 'magic',
    name: 'มนตรา',
    color: '#4ade80',
    bgColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: '#22c55e',
    glowColor: 'rgba(34, 197, 94, 0.50)',
    multiplier: 1.35,
    affixCount: 1,
    dropWeight: 26
  },
  rare: {
    id: 'rare',
    name: 'หายาก',
    color: '#38bdf8',
    bgColor: 'rgba(56, 189, 248, 0.16)',
    borderColor: '#0284c7',
    glowColor: 'rgba(56, 189, 248, 0.65)',
    multiplier: 1.8,
    affixCount: 2,
    dropWeight: 10
  },
  epic: {
    id: 'epic',
    name: 'ศิลาแลงโบราณ',
    color: '#c084fc',
    bgColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#9333ea',
    glowColor: 'rgba(168, 85, 247, 0.75)',
    multiplier: 2.4,
    affixCount: 3,
    dropWeight: 3.5
  },
  legendary: {
    id: 'legendary',
    name: 'ศาสตราเทวะ',
    color: '#fbbf24',
    bgColor: 'rgba(234, 179, 8, 0.22)',
    borderColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.90)',
    multiplier: 3.2,
    affixCount: 4,
    dropWeight: 0.5
  }
};

const ITEM_TEMPLATES = {
  // --- WEAPONS (อาวุธ) ---
  wp_club_wood: {
    name: 'กระบองไม้ประดู่ลงยันต์',
    slot: 'weapon',
    icon: 'Assets/items/wp_club_spikes.png',
    baseRarity: 'common',
    baseStats: { attack: 10, critRate: 2 },
    lore: 'กระบองไม้เนื้อแข็งแกะสลักอักขระขอมโบราณ ใช้วัดกำลังเริ่มต้นของนักรบหิมพานต์'
  },
  wp_club_spikes: {
    name: 'กระบองเหล็กหนามยักษ์',
    slot: 'weapon',
    icon: 'Assets/items/wp_club_spikes.png',
    baseRarity: 'magic',
    baseStats: { attack: 18, critRate: 4, str: 3 },
    lore: 'ตีขึ้นจากเหล็กดำแห่งหุบเขาไกรลาส ติดหนามแหลมคมทุบทำลายเกราะศัตรู'
  },
  wp_trident_bronze: {
    name: 'ตรีศูลสำริดหิมพานต์',
    slot: 'weapon',
    icon: 'Assets/items/wp_trident_bronze.png',
    baseRarity: 'rare',
    baseStats: { attack: 30, critRate: 6, str: 6, atkCooldown: -0.03 },
    lore: 'ตรีศูลสามง่ามเนื้อสัมฤทธิ์ประกายเขียวครึ้ม สั่นสะเทือนพลังธาตุแห่งพงไพร'
  },
  wp_sword_fafeun: {
    name: 'ดาบฟ้าฟื้นพิชิตมาร',
    slot: 'weapon',
    icon: 'Assets/items/wp_trident_bronze.png',
    baseRarity: 'epic',
    baseStats: { attack: 48, critRate: 9, str: 10, agi: 5, atkCooldown: -0.06 },
    lore: 'ศาสตราวุธในตำนานตีจากเหล็กไหลและพรายโลหะ เมื่อฟาดฟันบังเกิดสายฟ้าฟาดกึกก้อง'
  },
  wp_spear_mokkasak: {
    name: 'หอกโมกขศักดิ์มหากาฬ',
    slot: 'weapon',
    icon: 'Assets/items/wp_trident_bronze.png',
    baseRarity: 'legendary',
    baseStats: { attack: 72, critRate: 14, str: 16, vit: 8, atkCooldown: -0.08 },
    lore: 'ยอดหอกเทวะอันดับหนึ่งแห่งมหากาพย์ ทะลวงผลาญทุกการป้องกัน ไร้สิ่งใดต้านทานได้'
  },
  wp_phra_khan_tri: {
    name: 'พระขรรค์ตรีภพปราบอสุรา',
    slot: 'weapon',
    icon: 'Assets/items/wp_trident_bronze.png',
    baseRarity: 'legendary',
    baseStats: { attack: 76, critRate: 16, str: 18, agi: 10, atkCooldown: -0.10 },
    lore: 'พระขรรค์ทองคำเทวราช ส่องแสงประกายสีทอง ขจัดวิญญาณบาปและมารร้ายสูญสลาย'
  },

  // --- ARMOR (เกราะอสุรา) ---
  ar_leather_hide: {
    name: 'เกราะหนังสัตว์ป่าดงพญาเย็น',
    slot: 'armor',
    icon: 'Assets/items/ar_leather_hide.png',
    baseRarity: 'common',
    baseStats: { defense: 6, maxHp: 45 },
    lore: 'ฟอกขึ้นจากหนังสัตว์ป่าหนาทนทาน ช่วยผ่อนแรงกระแทกจากกรงเล็บอสูร'
  },
  ar_buffalo_plate: {
    name: 'เกราะหนังควายธนูลงอักขระ',
    slot: 'armor',
    icon: 'Assets/items/ar_buffalo_plate.png',
    baseRarity: 'magic',
    baseStats: { defense: 14, maxHp: 90, bleedResist: 12 },
    lore: 'หนังพญาควายธนูลงอักขระคงกระพันชาตรี คมมีดฟันไม่เข้า แทงไม่ระคายผิว'
  },
  ar_naga_scales: {
    name: 'เกราะเกล็ดพญานาคา',
    slot: 'armor',
    icon: 'Assets/items/ar_naga_scales.png',
    baseRarity: 'rare',
    baseStats: { defense: 26, maxHp: 180, bleedResist: 25, vit: 7 },
    lore: 'เกล็ดพญานาคสีมรกตเลื่อมประกายน้ำ เย็นเยียบดุจสายน้ำ ลดทอนความเสียหายร้ายแรง'
  },
  ar_suvarn_asura: {
    name: 'เกราะสุวรรณอสุรินทร์',
    slot: 'armor',
    icon: 'Assets/items/ar_suvarn_asura.png',
    baseRarity: 'epic',
    baseStats: { defense: 42, maxHp: 320, bleedResist: 40, vit: 14 },
    lore: 'เกราะทองคำของแม่ทัพยักษ์โบราณ สลักลายกนกเปลวเพลิงคุ้มครองกายารอบด้าน'
  },
  ar_diamond_gem: {
    name: 'เกราะอกทับทรวงและอินธนูปีกสวรรค์อัครเทวราช',
    slot: 'armor',
    icon: 'Assets/costumes/armor_celestial_gold_icon.png?v=cuirass_v1',
    spritesheet: 'Assets/costumes/armor_celestial_gold_sheet.png?v=cuirass_v1',
    armorStyle: 'celestial_gold',
    baseRarity: 'legendary',
    baseStats: { defense: 78, maxHp: 650, bleedResist: 60, vit: 24, str: 16, maxMp: 160, critRate: 10 },
    lore: 'เกราะอกทับทรวงทองคำบริสุทธิ์และอินธนูไหล่ติดปีกสวรรค์สีขาวขลิบทอง ประดับเพชรฟ้าดารารายกลางอก เข้าเซ็ตคู่กับชฎามงกุฎอัครเทวราชและปีกอัครเทวทูตสวรรค์ 6 ปีก'
  },

  // --- BRACERS (สนับแขน) ---
  br_cloth_wraps: {
    name: 'ผ้ารัดข้อมือฝ้ายดิบลงเวท',
    slot: 'bracer',
    icon: 'Assets/items/br_tiger_fangs.png',
    baseRarity: 'common',
    baseStats: { attack: 4, speed: 6 },
    lore: 'ผ้าฝ้ายถักทอด้วยมนต์เสน่ห์ ช่วยให้ข้อมือกวัดแกว่งอาวุธได้มั่นคงขึ้น'
  },
  br_bronze_guards: {
    name: 'สนับแขนสำริดโบราณ',
    slot: 'bracer',
    icon: 'Assets/items/br_bronze_guards.png',
    baseRarity: 'magic',
    baseStats: { attack: 8, speed: 12, agi: 4 },
    lore: 'สนับแขนโลหะสัมฤทธิ์โบราณ ช่วยเพิ่มพลังกำปั้นและความคล่องตัว'
  },
  br_tiger_fangs: {
    name: 'สนับมือเขี้ยวพยัคฆ์สมิง',
    slot: 'bracer',
    icon: 'Assets/items/br_tiger_fangs.png',
    baseRarity: 'rare',
    baseStats: { attack: 16, speed: 18, critRate: 5, agi: 8 },
    lore: 'ประดับด้วยเขี้ยวเสือสมิงอาคม ทำให้การออกอาวุธฉับไวดุจเสือกระโจน'
  },
  br_gold_bali: {
    name: 'สนับกรทองคำพญาพาลี',
    slot: 'bracer',
    icon: 'Assets/items/br_bronze_guards.png',
    baseRarity: 'epic',
    baseStats: { attack: 28, speed: 25, critRate: 8, agi: 14, atkCooldown: -0.05 },
    lore: 'สนับกรสลักรูปพญาพาลีเจ้าเมืองขีดขิน ยืมพละกำลังกึ่งหนึ่งของคู่ต่อสู้มาเป็นของตน'
  },
  br_hanuman_bracers: {
    name: 'สนับกรปลอกแขนทองคำปีกสวรรค์อัครเทวราช',
    slot: 'bracer',
    icon: 'Assets/costumes/bracer_celestial_gold_icon.png?v=bracer_v1',
    spritesheet: 'Assets/costumes/bracer_celestial_gold_sheet.png?v=bracer_v1',
    bracerStyle: 'celestial_gold',
    baseRarity: 'legendary',
    baseStats: { attack: 52, speed: 40, critRate: 15, agi: 24, str: 18, atkCooldown: -0.09 },
    lore: 'สนับกรปลอกแขนทองคำบริสุทธิ์สลักลายกนก ประดับเพชรฟ้าดารารายและปีกสวรรค์สีขาวขลิบทองข้างลำแขน เข้าเซ็ตคู่กับชุดอัครเทวราช เสริมความเร็วออกอาวุธดุจสายฟ้าฟาด'
  },

  // --- TALISMAN / AMULETS (เครื่องราง) ---
  tl_string_sai_sin: {
    name: 'ด้ายสายสิญจน์มงคลเก้า',
    slot: 'talisman',
    icon: 'Assets/items/tl_takrud_tone.png',
    baseRarity: 'common',
    baseStats: { maxMp: 25, spi: 3 },
    lore: 'ด้ายสายสิญจน์ปลุกเสกเก้าพิธี คุ้มกันจิตใจไม่ให้หวั่นเกรงต่อภูตผี'
  },
  tl_takrud_tone: {
    name: 'ตะกรุดโทนมหาปราบ',
    slot: 'talisman',
    icon: 'Assets/items/tl_takrud_tone.png',
    baseRarity: 'magic',
    baseStats: { maxMp: 50, defense: 8, spi: 6 },
    lore: 'แผ่นตะกั่วลงยันต์มหาปราบม้วนรัดเชือกถัก ป้องกันภัยอันตรายและภูตผีปีศาจ'
  },
  tl_mit_mor: {
    name: 'มีดหมอปราบไตรภพ',
    slot: 'talisman',
    icon: 'Assets/items/tl_holy_conch.png',
    baseRarity: 'rare',
    baseStats: { attack: 14, critRate: 6, bleedResist: 20, spi: 10 },
    lore: 'ด้ามและฝักแกะจากไม้เสาตะเคียนใบมีดจารอักขระพุทธคุณ กำราบวิญญาณร้าย'
  },
  tl_pha_yant: {
    name: 'ผ้ายันต์มหาอุตม์แคล้วคลาด',
    slot: 'talisman',
    icon: 'Assets/items/tl_lotus_anodat.png',
    baseRarity: 'epic',
    baseStats: { maxHp: 180, defense: 20, bleedResist: 30, spi: 14, vit: 8 },
    lore: 'ผ้ายันต์ลงหมึกว่านยา ๑๐๘ ชนิด บันดาลให้แคล้วคลาดปลอดภัยจากอาวุธศัตรู'
  },
  tl_bia_gae: {
    name: 'เบี้ยแก้สารพัดกันเทวฤทธิ์',
    slot: 'talisman',
    icon: 'Assets/items/tl_bia_gae.png',
    baseRarity: 'legendary',
    baseStats: { maxHp: 300, maxMp: 140, defense: 30, critRate: 9, str: 8, agi: 8, vit: 8, spi: 16 },
    lore: 'หอยเบี้ยบรรจุปรอทเสกหุ้มตะกั่วถักเชือกลงรัก ป้องกันคุณไสยมนต์ดำ กลับร้ายกลายเป็นดี'
  },

  // --- HELMET / HEADWEAR (หมวก / ชฎา / รัดเกล้า) ---
  hm_cloth_band: {
    name: 'ผ้าประเจียดโพกศีรษะลงยันต์',
    slot: 'helmet',
    icon: 'Assets/items/hm_cloth_band.png',
    baseRarity: 'common',
    baseStats: { defense: 4, maxHp: 25 },
    lore: 'ผ้าประเจียดจารอักขระคาถา มัดผูกกระหม่อมเพื่อความคงกระพันเบื้องต้น'
  },
  hm_iron_helm: {
    name: 'หมวกเกราะเหล็กอสูร',
    slot: 'helmet',
    icon: 'Assets/items/hm_iron_helm.png',
    baseRarity: 'magic',
    baseStats: { defense: 10, maxHp: 70, vit: 4 },
    lore: 'หมวกเกราะเหล็กแกร่งสลักรูปหน้ายักษ์ ป้องกันอันตรายส่วนศีรษะจากการโจมตีหนัก'
  },
  hm_naga_crown: {
    name: 'รัดเกล้าเกล็ดพญานาคา',
    slot: 'helmet',
    icon: 'Assets/items/hm_yaksha_mask.png',
    baseRarity: 'rare',
    baseStats: { defense: 22, maxHp: 150, maxMp: 50, vit: 8 },
    lore: 'รัดเกล้าหัวพญานาคแผ่พังพาน เสริมพลังสมาธิญาณและปราการเวทมนตร์'
  },
  hm_chada_gold: {
    name: 'ชฎายอดทองคำสุวรรณภูมิ',
    slot: 'helmet',
    icon: 'Assets/items/hm_chada_gold.png',
    baseRarity: 'epic',
    baseStats: { defense: 38, maxHp: 260, critRate: 5, str: 6, agi: 6, vit: 8, spi: 8 },
    lore: 'ชฎาทองคำแท้ประดับพลอยทับทิม เครื่องทรงกษัตริย์และแม่ทัพเทวะ สง่างามน่าเกรงขาม'
  },
  hm_crown_deva: {
    name: 'ชฎามงกุฎอัครเทวราชทองคำประดับเพชรฟ้า',
    slot: 'helmet',
    icon: 'Assets/costumes/helmet_celestial_chada_icon.png?v=chada_v1',
    spritesheet: 'Assets/costumes/helmet_celestial_chada_sheet.png?v=chada_v1',
    helmetStyle: 'celestial_chada',
    baseRarity: 'legendary',
    baseStats: { defense: 68, maxHp: 520, maxMp: 240, critRate: 14, attack: 35, str: 16, agi: 16, vit: 18, spi: 20 },
    lore: 'ชฎามงกุฎทองคำบริสุทธิ์แห่งอัครเทวราช ประดับเพชรฟ้าดารารายและปีกสวรรค์สีขาวบริสุทธิ์ข้างขมับ เข้าเซ็ตคู่กับปีกอัครเทวทูตสวรรค์ 6 ปีก ส่องรัศมีเทวานุภาพเหนือสามภพ'
  },

  // --- PANTS / LEGGINGS (กางเกง / สนับเพลา) ---
  pn_cloth_pha_nung: {
    name: 'ผ้านุ่งโจงกระเบนไพรกระชับ',
    slot: 'pants',
    icon: 'Assets/items/pn_hunter_pants.png',
    baseRarity: 'common',
    baseStats: { defense: 3, speed: 5 },
    lore: 'ผ้านุ่งโจงกระเบนถักทอทะมัดทะแมง เหมาะกับการย่ำบึงป่าดงดิบ'
  },
  pn_hunter_pants: {
    name: 'สนับเพลาหนังเสือพราย',
    slot: 'pants',
    icon: 'Assets/items/pn_hunter_pants.png',
    baseRarity: 'magic',
    baseStats: { defense: 9, speed: 10, agi: 4 },
    lore: 'สนับเพลาตัดเย็บจากหนังพยัคฆ์ลายพาดกลอน ช่วยให้ช่วงล่างว่องไวทรงพลัง'
  },
  pn_iron_greaves: {
    name: 'สนับเพลาเหล็กหล่อลงอาคม',
    slot: 'pants',
    icon: 'Assets/items/pn_hunter_pants.png',
    baseRarity: 'rare',
    baseStats: { defense: 20, maxHp: 100, speed: 14, vit: 6 },
    lore: 'แผ่นเหล็กประกบต้นขาจรดหน้าแข้ง สลักอักขระกันกระแทกอย่างหนาแน่น'
  },
  pn_gold_asura: {
    name: 'สนับเพลาทองคำอสุรินทร์',
    slot: 'pants',
    icon: 'Assets/costumes/pants_deva_gold.png',
    baseRarity: 'epic',
    baseStats: { defense: 34, maxHp: 200, speed: 20, vit: 10, agi: 8 },
    lore: 'สนับเพลาทองคำสลักลายกนกทวยเทพ หนักแน่นแต่ว่องไวดั่งสายฟ้าฟาด'
  },
  pn_indra_silk: {
    name: 'สนับเพลายกพรายทองกนกอัครเทวราช',
    slot: 'pants',
    icon: 'Assets/costumes/pants_deva_gold.png?v=sabatons_v2',
    spritesheet: 'Assets/costumes/boots_celestial_gold_sheet.png?v=sabatons_v2',
    baseRarity: 'legendary',
    baseStats: { defense: 54, maxHp: 380, speed: 28, vit: 18, agi: 16, critRate: 6 },
    lore: 'ผ้านุ่งโจงกระเบนไหมยกทองสีแดงชาดพร้อมชายไหวชายแครงทองคำประดับเพชรฟ้าและเกราะสนับเข่ากนกทวยเทพ'
  },

  // --- BOOTS / FOOTWEAR (รองเท้า / ฉลองพระบาท) ---
  bt_straw_sandals: {
    name: 'เกือกหญ้าถักอาคมแคล้วคลาด',
    slot: 'boots',
    icon: 'Assets/items/bt_golden_sabaton.png',
    baseRarity: 'common',
    baseStats: { speed: 8 },
    lore: 'เกือกสานจากหญ้าคาปลุกเสก ก้าวเดินเงียบกริบในดงพงไพร'
  },
  bt_leather_boots: {
    name: 'รองเท้าหนังกระทิงดง',
    slot: 'boots',
    icon: 'Assets/items/bt_golden_sabaton.png',
    baseRarity: 'magic',
    baseStats: { speed: 16, defense: 6, agi: 3 },
    lore: 'รองเท้าหนังกระทิงภูเขาหนาแน่น ทนทานต่อโขดหินคมและหนามพิษ'
  },
  bt_wind_treads: {
    name: 'ฉลองพระบาทวายุภักษ์',
    slot: 'boots',
    icon: 'Assets/items/bt_golden_sabaton.png',
    baseRarity: 'rare',
    baseStats: { speed: 26, defense: 12, agi: 8, atkCooldown: -0.03 },
    lore: 'ฉลองพระบาทแห่งนกวายุภักษ์ แต่ละย่างก้าวเสมือนลอยเหนือพื้นดิน'
  },
  bt_garuda_talons: {
    name: 'ฉลองพระบาทกรงเล็บพญาครุฑ',
    slot: 'boots',
    icon: 'Assets/items/bt_golden_sabaton.png',
    baseRarity: 'epic',
    baseStats: { speed: 40, defense: 22, critRate: 6, agi: 15, str: 6 },
    lore: 'ปลายฉลองพระบาทติดกรงเล็บทองคำพญาครุฑ เสริมแรงกระโดดและจังหวะเตะทำลายล้าง'
  },
  bt_celestial_stride: {
    name: 'ชุดเกราะขาและฉลองพระบาททองคำปลายงอนติดปีกสวรรค์',
    slot: 'boots',
    icon: 'Assets/costumes/boots_deva_gold.png?v=sabatons_v2',
    spritesheet: 'Assets/costumes/boots_celestial_gold_sheet.png?v=sabatons_v2',
    bootsStyle: 'celestial_gold',
    baseRarity: 'legendary',
    baseStats: { speed: 68, defense: 45, critRate: 12, agi: 28, vit: 14, atkCooldown: -0.07 },
    lore: 'ชุดเกราะขาทองคำครบชุดตั้งแต่สนับเพลายกพรายทอง ชายไหวชายแครง สนับเข่า สนับแข้ง จรดฉลองพระบาททองคำปลายงอนติดปีกสวรรค์สีขาวบริสุทธิ์'
  },

  // --- WINGS (ปีกนางฟ้า / ปีกกินรี / ปีกครุฑ) ---
  wg_kinnari_emerald: {
    name: 'ปีกกินรีเขียวมรกตหิมพานต์',
    slot: 'wings',
    icon: 'Assets/items/wg_garuda_infernal.png',
    wingStyle: 'emerald',
    baseRarity: 'rare',
    baseStats: { speed: 32, maxMp: 120, critRate: 6, agi: 10, spi: 12 },
    lore: 'ปีกนางกินรีแห่งสระอโนดาต ส่องประกายสีเขียวมรกต กระพือพลิ้วโบยบินดั่งสายลม'
  },
  wg_angelic_celestial: {
    name: 'ปีกอัครเทวทูตสวรรค์ 6 ปีก (Seraphim 6-Wings)',
    slot: 'wings',
    icon: 'Assets/costumes/wings_pixel_icon.png?v=seraphim_v1',
    wingStyle: 'gold',
    spritesheet: 'Assets/costumes/wings_pixel_spritesheet.png?v=seraphim_v1',
    frameCount: 5,
    baseRarity: 'legendary',
    baseStats: { speed: 72, attack: 60, maxHp: 500, maxMp: 350, defense: 45, critRate: 18, allStats: 18 },
    lore: 'ปีกอัครเทวทูตสวรรค์ 6 ปีก (Seraphim) สีขาวบริสุทธิ์ขลิบทองคำลายกนก ประดับอัญมณีฟ้าดาราราย โปรยปรายขนนกแห่งแสงศักดิ์สิทธิ์ทุกย่างก้าว'
  },
  wg_garuda_infernal: {
    name: 'ปีกพญาครุฑเพลิงสุริยันต์ (Pixel Art)',
    slot: 'wings',
    icon: 'Assets/items/wg_garuda_infernal.png',
    wingStyle: 'fire',
    spritesheet: 'Assets/costumes/wings_garuda_flame_sheet.png',
    frameCount: 4,
    frameWidth: 96,
    frameHeight: 64,
    baseRarity: 'legendary',
    baseStats: { speed: 68, attack: 55, critRate: 16, maxHp: 450, str: 20, agi: 16, vit: 14 },
    lore: 'ปีกเพลิงสุริยคราสของพญาสุบรรณครุฑราช โบกสะบัดพัดพาเปลวเพลิงแผดเผาอธรรม สไตล์ 16-Bit Pixel Art'
  },
  wg_void_shadow: {
    name: 'ปีกมารทมิฬราหูอมจันทร์',
    slot: 'wings',
    icon: 'Assets/costumes/wings_celestial_gold.png',
    wingStyle: 'void',
    baseRarity: 'legendary',
    baseStats: { speed: 64, attack: 65, critRate: 18, atkCooldown: -0.09, bleedResist: 45, str: 18, agi: 22 },
    lore: 'ปีกสีนิลกาฬแห่งพระราหู บดบังแสงตะวัน ปลดปล่อยคลื่นความมืดกลืนกินสรรพสิ่ง'
  },

  // --- CONSUMABLES / POTIONS (ยาโอสถฟื้นฟู) ---
  pot_hp_gourd: {
    name: 'น้ำเต้าโอสถทิพย์ฟื้นฟูเลือด',
    slot: 'consumable',
    category: 'potion',
    itemType: 'hp_potion',
    icon: 'Assets/ui/icon_potion_hp.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 50,
    lore: 'น้ำเต้าโอสถทิพย์สีชาด ฟื้นฟูพลังชีวิต 45% Max HP ทันทีที่ดื่ม'
  },
  pot_mp_gourd: {
    name: 'น้ำเต้าอมฤตฟื้นฟูมานา',
    slot: 'consumable',
    category: 'potion',
    itemType: 'mp_potion',
    icon: 'Assets/ui/icon_potion_mp.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 50,
    lore: 'น้ำเต้าศิลาแก้วมนตราสีคราม ฟื้นฟูพลังมานา 50% Max MP ทันทีที่ดื่ม'
  },
  scroll_town_portal: {
    name: 'ม้วนคาถาหวนคืนอาราม',
    slot: 'consumable',
    category: 'scroll',
    itemType: 'town_portal',
    icon: 'Assets/items/pixel_weapons_sheet.png',
    baseRarity: 'uncommon',
    baseStats: {},
    maxStack: 99,
    value: 80,
    lore: 'ม้วนคัมภีร์ใบลานลงอักขระมนตรา เมื่ออ่านจะเปิดประตูมิติพาวาร์ปกลับสู่วิหารศิลาแลงจุดเกิดทันที'
  },
  elixir_wind_speed: {
    name: 'ยาหม่องทิพย์วายุภักษ์',
    slot: 'consumable',
    category: 'potion',
    itemType: 'speed_potion',
    icon: 'Assets/ui/icon_potion_mp.png',
    baseRarity: 'uncommon',
    baseStats: {},
    maxStack: 99,
    value: 60,
    lore: 'ยาหม่องว่านวิเศษทาฝ่าเท้า เพิ่มความเร็วเคลื่อนที่ +35% นาน 30 วินาที'
  },
  food_herbal_rice: {
    name: 'ข้าวเหนียวทิพย์สมุนไพร',
    slot: 'consumable',
    category: 'food',
    itemType: 'hp_food',
    icon: 'Assets/ui/icon_potion_hp.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 25,
    lore: 'ข้าวเหนียวนึ่งหอมกรุ่นห่อใบตอง ฟื้นฟูเลือด 150 หน่วยทันที'
  },
  drink_magic_coconut: {
    name: 'น้ำมะพร้าวแก้วมนตรา',
    slot: 'consumable',
    category: 'food',
    itemType: 'mp_food',
    icon: 'Assets/ui/icon_potion_mp.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 25,
    lore: 'น้ำมะพร้าวทิพย์เย็นชื่นใจ ดื่มแล้วฟื้นฟูมานา 80 หน่วยทันที'
  },

  // --- MONSTER DROPS & MATERIALS (ชิ้นส่วนมอนสเตอร์ / ขยะขายร้าน) ---
  mat_boar_tusk: {
    name: 'เขี้ยวหมูป่าโลกันตร์',
    slot: 'junk',
    category: 'material',
    itemType: 'monster_drop',
    icon: 'Assets/items/pixel_weapons_sheet.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 35,
    lore: 'เขี้ยวหมูป่าอสูรเนื้อแกร่ง เป็นที่ต้องการของพ่อค้าเพื่อนำไปแกะสลักเครื่องราง ขายได้ราคางาม'
  },
  mat_boar_hide: {
    name: 'หนังหมูป่าหนาทึบ',
    slot: 'junk',
    category: 'material',
    itemType: 'monster_drop',
    icon: 'Assets/items/pixel_armors_sheet.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 28,
    lore: 'แผ่นหนังหมูป่าเหนียวทนทาน ช่างเย็บในหมู่บ้านรับซื้อไม่อั้นเพื่อนำไปฟอกทำเกราะ'
  },
  mat_preta_bone: {
    name: 'กระดูกเปรตอาถรรพ์',
    slot: 'junk',
    category: 'material',
    itemType: 'monster_drop',
    icon: 'Assets/items/pixel_weapons_sheet.png',
    baseRarity: 'uncommon',
    baseStats: {},
    maxStack: 99,
    value: 48,
    lore: 'ชิ้นส่วนกระดูกเปรตหิวกระหายเปี่ยมไออสูร นักปรุงยาและปู่ฤๅษีรับซื้อเพื่อนำไปสกัดยาขับพิษ'
  },
  mat_sacred_ash: {
    name: 'ผงเถ้ากระดูกอสูร',
    slot: 'junk',
    category: 'material',
    itemType: 'monster_drop',
    icon: 'Assets/items/pixel_weapons_sheet.png',
    baseRarity: 'common',
    baseStats: {},
    maxStack: 99,
    value: 32,
    lore: 'เถ้าธุลีที่หลงเหลือจากการกำราบอสูร ขายให้พ่อค้าแม่ค้าแลกเป็นเงินพดด้วงได้ทันที'
  },

  // --- MONSTER SOUL CARDS (การ์ดดวงจิตอสูรหิมพานต์ ฝังใส่อุปกรณ์) ---
  card_tiger: {
    name: 'การ์ดดวงจิตเสือสมิง',
    slot: 'card',
    category: 'card',
    itemType: 'monster_card',
    icon: 'Assets/cards/card_tiger.png?v=32',
    fullArt: 'Assets/cards/card_tiger_full.png?v=32',
    baseRarity: 'epic',
    targetSlots: ['weapon', 'bracer', 'helmet', 'armor', 'pants', 'boots', 'wings', 'talisman'],
    prefixTitle: 'พยัคฆ์สมิง',
    specialKey: 'tiger_crit',
    specialDesc: '💥 โจมตีคริติคอลรุนแรงขึ้น +25% และมีออร่าเพลิงสมิงเมื่อฟาดฟัน',
    baseStats: { attack: 18, critRate: 8, str: 5 },
    maxStack: 99,
    value: 450,
    lore: 'แผ่นยันต์ทองคำผนึกวิญญาณเสือสมิงอาคมแห่งดงพญาเย็น เมื่อฝังลงในศาสตราวุธหรือชุดเกราะจะปลุกสัญชาตญาณนักล่ากระหายเลือด'
  },
  card_serpent: {
    name: 'การ์ดดวงจิตพญางูอสูร',
    slot: 'card',
    category: 'card',
    itemType: 'monster_card',
    icon: 'Assets/cards/card_serpent.png?v=32',
    fullArt: 'Assets/cards/card_serpent_full.png?v=32',
    baseRarity: 'epic',
    targetSlots: ['weapon', 'armor', 'talisman', 'helmet', 'bracer', 'pants', 'boots', 'wings'],
    prefixTitle: 'พิษพญานาคา',
    specialKey: 'serpent_lifesteal',
    specialDesc: '🩸 ดูดซับพลังชีวิต (Lifesteal) ฟื้นฟู 8% ของดาเมจที่โจมตีกลับมาเป็น HP ทันที',
    baseStats: { attack: 14, maxHp: 120, spi: 6 },
    maxStack: 99,
    value: 480,
    lore: 'ดวงจิตพญางูอสูรเขี้ยวมรกต อาบด้วยพิษอมฤตโบราณ เปลี่ยนหยาดเลือดของศัตรูให้กลายเป็นพลังชีวิตหล่อเลี้ยงผู้สวมใส่'
  },
  card_swordsman: {
    name: 'การ์ดดวงจิตนักรบดาบอาคม',
    slot: 'card',
    category: 'card',
    itemType: 'monster_card',
    icon: 'Assets/cards/card_swordsman.png?v=32',
    fullArt: 'Assets/cards/card_swordsman_full.png?v=32',
    baseRarity: 'epic',
    targetSlots: ['weapon', 'boots', 'wings', 'bracer', 'helmet', 'armor', 'pants', 'talisman'],
    prefixTitle: 'ดาบคู่ผีสิง',
    specialKey: 'swordsman_double',
    specialDesc: '⚡ มีโอกาส 25% ที่การโจมตีจะปล่อยคลื่นดาบอาคมฟันซ้ำสองฮิต (Double Strike!)',
    baseStats: { attack: 16, speed: 18, agi: 7 },
    maxStack: 99,
    value: 520,
    lore: 'วิญญาณยอดขุนพลดาบคู่ผู้ไม่ยอมดับสูญ เสริมความเร็วปานพายุและวิชาดาบเงาคู่ให้แก่ผู้ครอบครอง'
  },
  card_asura_boss: {
    name: 'การ์ดดวงจิตท้าวอสูรทมิฬ [BOSS]',
    slot: 'card',
    category: 'card',
    itemType: 'monster_card',
    icon: 'Assets/cards/card_asura_boss.png?v=32',
    fullArt: 'Assets/cards/card_asura_boss_full.png?v=32',
    baseRarity: 'legendary',
    targetSlots: ['weapon', 'helmet', 'armor', 'bracer', 'wings', 'pants', 'boots', 'talisman'],
    prefixTitle: 'จอมมารอสุรา',
    specialKey: 'asura_lightning',
    specialDesc: '🌩️ เมื่อโจมตีมีโอกาส 30% ผ่าสายฟ้าอสุราสีม่วงทองใส่ศัตรู สร้างดาเมจเพิ่มเติม 55% ATK!',
    baseStats: { attack: 32, defense: 18, maxHp: 220, critRate: 10, str: 8, spi: 8 },
    maxStack: 99,
    value: 1500,
    lore: 'สุดยอดการ์ดดวงจิตระดับตำนานของจอมมารท้าวอสูรทมิฬ เปี่ยมด้วยอำนาจสายฟ้าอสุราสะท้านสามภพ'
  }
};

// Affix Pools for random bonuses
const RANDOM_AFFIXES = [
  { key: 'attack', label: '⚔️ พลังโจมตี', min: 4, max: 12, suffix: '' },
  { key: 'defense', label: '🛡️ พลังป้องกัน', min: 3, max: 9, suffix: '' },
  { key: 'maxHp', label: '❤️ พลังชีวิต', min: 30, max: 90, suffix: '' },
  { key: 'maxMp', label: '💧 พลังมานา', min: 20, max: 60, suffix: '' },
  { key: 'critRate', label: '💥 คริติคอล', min: 2, max: 5, suffix: '%' },
  { key: 'speed', label: '🏃 ความเร็วเดิน', min: 5, max: 15, suffix: ' px/s' },
  { key: 'str', label: '💪 STR พละกำลัง', min: 2, max: 6, suffix: '' },
  { key: 'vit', label: '💎 VIT กายาเหล็ก', min: 2, max: 6, suffix: '' },
  { key: 'agi', label: '⚡ AGI วายุพริ้ว', min: 2, max: 6, suffix: '' },
  { key: 'spi', label: '🌸 SPI อาคมญาณ', min: 2, max: 6, suffix: '' },
  { key: 'bleedResist', label: '🩸 ต้านเลือดไหล', min: 5, max: 15, suffix: '%' }
];

class ItemSystem {
  static getRarity(rarityId) {
    return RARITY_TIERS[rarityId] || RARITY_TIERS.common;
  }

  static isEquipSlot(slot) {
    return ['weapon', 'helmet', 'armor', 'bracer', 'wings', 'pants', 'boots', 'talisman'].includes(slot);
  }

  /**
   * Generates a concrete item instance with randomized stat rolls based on rarity.
   */
  static createItem(templateKey, overrideRarity = null) {
    const tmpl = ITEM_TEMPLATES[templateKey];
    if (!tmpl) return null;

    const isCard = tmpl.slot === 'card' || tmpl.itemType === 'monster_card';
    const isEquip = this.isEquipSlot(tmpl.slot);

    const rarityKey = isCard ? tmpl.baseRarity : (overrideRarity || tmpl.baseRarity);
    const rarity = this.getRarity(rarityKey);
    const id = 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);

    const finalStats = {};
    for (const [sKey, sVal] of Object.entries(tmpl.baseStats || {})) {
      if (isCard) {
        finalStats[sKey] = sVal;
      } else if (sKey === 'atkCooldown') {
        finalStats[sKey] = Number((sVal * (1 + (rarity.multiplier - 1) * 0.25)).toFixed(2));
      } else {
        const variance = 0.88 + Math.random() * 0.24; // 88% - 112%
        finalStats[sKey] = Math.max(1, Math.round(sVal * variance * (rarity.multiplier / (RARITY_TIERS[tmpl.baseRarity]?.multiplier || 1))));
      }
    }

    const affixes = [];
    if (isEquip) {
      const usedAffixKeys = new Set(Object.keys(finalStats));
      const availableAffixes = RANDOM_AFFIXES.filter(a => !usedAffixKeys.has(a.key));
      const affixCount = Math.min(rarity.affixCount, availableAffixes.length);
      const shuffled = [...availableAffixes].sort(() => Math.random() - 0.5);

      for (let i = 0; i < affixCount; i++) {
        const aff = shuffled[i];
        const rollVal = Math.round(aff.min + Math.random() * (aff.max - aff.min) * (rarity.multiplier * 0.7));
        finalStats[aff.key] = (finalStats[aff.key] || 0) + rollVal;
        affixes.push({
          key: aff.key,
          label: aff.label,
          value: rollVal,
          suffix: aff.suffix
        });
      }
    }

    return {
      id,
      key: templateKey,
      templateKey,
      baseName: tmpl.name,
      name: tmpl.name,
      slot: tmpl.slot,
      category: tmpl.category || (tmpl.slot === 'consumable' ? 'potion' : (isCard ? 'card' : 'equip')),
      itemType: tmpl.itemType || null,
      count: tmpl.count || 1,
      maxStack: tmpl.maxStack || (tmpl.slot === 'consumable' || isCard ? 99 : 1),
      icon: tmpl.icon,
      fullArt: tmpl.fullArt || null,
      targetSlots: tmpl.targetSlots || null,
      prefixTitle: tmpl.prefixTitle || null,
      specialKey: tmpl.specialKey || null,
      specialDesc: tmpl.specialDesc || null,
      wingStyle: tmpl.wingStyle || null,
      helmetStyle: tmpl.helmetStyle || null,
      armorStyle: tmpl.armorStyle || null,
      bracerStyle: tmpl.bracerStyle || null,
      bootsStyle: tmpl.bootsStyle || null,
      spritesheet: tmpl.spritesheet || null,
      rarity: rarityKey,
      stats: finalStats,
      affixes,
      maxSockets: isEquip ? 2 : 0,
      sockets: isEquip ? [] : undefined,
      lore: tmpl.lore,
      value: tmpl.value || Math.round(40 * rarity.multiplier + (Math.random() * 20))
    };
  }

  /**
   * Generates a random equipment drop tailored to the monster tier or chest.
   */
  static rollDrop(sourceType = 'normal', level = 1) {
    let rWeights;
    if (sourceType === 'boss') {
      rWeights = { rare: 35, epic: 50, legendary: 15 };
    } else if (sourceType === 'chest') {
      rWeights = { magic: 40, rare: 45, epic: 15 };
    } else if (sourceType === 'buffalo' || sourceType === 'elite') {
      rWeights = { magic: 45, rare: 40, epic: 15 };
    } else {
      rWeights = { common: 60, magic: 30, rare: 9, epic: 1 };
    }

    const totalWeight = Object.values(rWeights).reduce((a, b) => a + b, 0);
    let roll = Math.random() * totalWeight;
    let chosenRarity = 'common';

    for (const [rKey, weight] of Object.entries(rWeights)) {
      if (roll < weight) {
        chosenRarity = rKey;
        break;
      }
      roll -= weight;
    }

    // Only roll wearable equipment in rollDrop (cards have their own rollCardDrop)
    const templateKeys = Object.keys(ITEM_TEMPLATES).filter(k => this.isEquipSlot(ITEM_TEMPLATES[k].slot));
    let eligible = templateKeys.filter(k => {
      const tmpl = ITEM_TEMPLATES[k];
      return tmpl.baseRarity === chosenRarity || chosenRarity !== 'legendary';
    });

    if (eligible.length === 0) eligible = templateKeys;
    const chosenKey = eligible[Math.floor(Math.random() * eligible.length)];

    return this.createItem(chosenKey, chosenRarity);
  }

  /**
   * Rolls a Monster Soul Card drop based on the defeated monster type!
   */
  static rollCardDrop(enemyType = 'tiger', isBoss = false) {
    let cardKey = 'card_tiger';
    const t = String(enemyType || '').toLowerCase();
    if (isBoss || t === 'boss' || t === 'bosspreat' || t === 'buffalo') {
      cardKey = Math.random() < 0.75 ? 'card_asura_boss' : 'card_tiger';
    } else if (t === 'tiger') {
      cardKey = 'card_tiger';
    } else if (t === 'serpent' || t === 'krasue') {
      cardKey = 'card_serpent';
    } else if (t === 'swordsman' || t === 'monkey' || t === 'imp') {
      cardKey = 'card_swordsman';
    } else {
      const pool = ['card_tiger', 'card_serpent', 'card_swordsman'];
      cardKey = pool[Math.floor(Math.random() * pool.length)];
    }
    return this.createItem(cardKey);
  }

  /**
   * Sockets a Monster Soul Card into an Equipment Item (max 2 sockets per item).
   */
  static socketCardIntoEquipment(equipItem, cardItem) {
    if (!equipItem || !cardItem) return false;
    if (!this.isEquipSlot(equipItem.slot)) return false;

    if (!equipItem.maxSockets || equipItem.maxSockets < 2) equipItem.maxSockets = 2;
    if (!Array.isArray(equipItem.sockets)) equipItem.sockets = [];
    if (equipItem.sockets.length >= equipItem.maxSockets) return false;

    const cardTmpl = ITEM_TEMPLATES[cardItem.templateKey || cardItem.key] || cardItem;
    const socketEntry = {
      cardKey: cardItem.templateKey || cardItem.key,
      name: cardTmpl.name || cardItem.name,
      icon: cardTmpl.icon || cardItem.icon,
      fullArt: cardTmpl.fullArt || cardItem.fullArt,
      prefixTitle: cardTmpl.prefixTitle || 'อาคม',
      specialKey: cardTmpl.specialKey || null,
      specialDesc: cardTmpl.specialDesc || '',
      stats: { ...(cardTmpl.baseStats || cardItem.stats || {}) }
    };

    equipItem.sockets.push(socketEntry);
    this.updateSocketedItemName(equipItem);
    return true;
  }

  static updateSocketedItemName(equipItem) {
    if (!equipItem) return;
    if (!equipItem.baseName) {
      equipItem.baseName = equipItem.name.replace(/\s*\[.*?\].*$/, '');
    }
    if (Array.isArray(equipItem.sockets) && equipItem.sockets.length > 0) {
      const prefixes = equipItem.sockets.map(s => s.prefixTitle || 'อาคม').join('•');
      equipItem.name = `${equipItem.baseName} [${prefixes}]`;
    } else {
      equipItem.name = equipItem.baseName;
    }
  }
}

window.RARITY_TIERS = RARITY_TIERS;
window.ITEM_TEMPLATES = ITEM_TEMPLATES;
window.ItemSystem = ItemSystem;


