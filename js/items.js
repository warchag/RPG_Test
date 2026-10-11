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
    name: 'เกราะเพชรนพรัตน์เก็จมณี',
    slot: 'armor',
    icon: 'Assets/items/ar_suvarn_asura.png',
    baseRarity: 'legendary',
    baseStats: { defense: 65, maxHp: 520, bleedResist: 55, vit: 22, maxMp: 90 },
    lore: 'สุดยอดเกราะเทวะหลอมรวมนพเก้าประกายแสงสะท้อนมนต์ดำและคำสาปทั้งปวง'
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
    name: 'ปลอกแขนเทพวานรหนุมาน',
    slot: 'bracer',
    icon: 'Assets/items/br_tiger_fangs.png',
    baseRarity: 'legendary',
    baseStats: { attack: 42, speed: 36, critRate: 12, agi: 22, atkCooldown: -0.08 },
    lore: 'ปลอกแขนทหารเอกพระราม เคลื่อนไหวรวดเร็วดุจสายลม รัวโจมตีไร้ช่องโหว่'
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
    name: 'มงกุฎเทวราชตรีภพ',
    slot: 'helmet',
    icon: 'Assets/items/hm_crown_deva.png',
    baseRarity: 'legendary',
    baseStats: { defense: 58, maxHp: 440, maxMp: 120, critRate: 10, str: 12, agi: 12, vit: 14, spi: 16 },
    lore: 'มงกุฎแห่งจอมเทพผู้ครองสามภพ ส่องแสงออร่าแห่งปัญญาและอำนาจบารมีไร้เทียมทาน'
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
    name: 'สนับเพลายกพรายทองกนก',
    slot: 'pants',
    icon: 'Assets/costumes/pants_deva_gold.png',
    baseRarity: 'legendary',
    baseStats: { defense: 54, maxHp: 380, speed: 28, vit: 18, agi: 16, critRate: 6 },
    lore: 'ผ้านุ่งโจงกระเบนยกทองสลักลายกนกทวยเทพ พร้อมเกราะสนับเพลาทองคำลงยา หนักแน่นแต่ว่องไวดั่งสายฟ้าฟาด'
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
    name: 'ฉลองพระบาททองคำปลายงอนชดช้อย',
    slot: 'boots',
    icon: 'Assets/costumes/boots_deva_gold.png',
    baseRarity: 'legendary',
    baseStats: { speed: 60, defense: 38, critRate: 10, agi: 25, atkCooldown: -0.06 },
    lore: 'ยอดฉลองพระบาทแห่งเทวโลก ปลายงอนกนกชดช้อย ผู้สวมใส่เคลื่อนที่เร็วดั่งพายุหมุน ไร้ผู้ใดไล่ทัน'
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
    name: 'ปีกนางฟ้าเทวราชสุวรรณภูมิ (Pixel Art)',
    slot: 'wings',
    icon: 'Assets/costumes/wings_pixel_icon.png',
    wingStyle: 'gold',
    spritesheet: 'Assets/costumes/wings_pixel_spritesheet.png',
    frameCount: 5,
    baseRarity: 'legendary',
    baseStats: { speed: 52, maxHp: 320, maxMp: 240, defense: 28, critRate: 10, allStats: 12 },
    lore: 'ปีกนางฟ้าชาวสวรรค์สไตล์ Pixel Art แอนิเมชันขนนกทองคำแท้กระพือโบกสะบัดพลิ้วไหว ประดับอัญมณีฟ้าดาราราย'
  },
  wg_garuda_infernal: {
    name: 'ปีกพญาครุฑเพลิงสุริยันต์',
    slot: 'wings',
    icon: 'Assets/items/wg_garuda_infernal.png',
    wingStyle: 'fire',
    baseRarity: 'legendary',
    baseStats: { speed: 68, attack: 55, critRate: 16, maxHp: 450, str: 20, agi: 16, vit: 14 },
    lore: 'ปีกเพลิงสุริยคราสของพญาสุบรรณครุฑราช โบกสะบัดพัดพาเปลวเพลิงแผดเผาอธรรม'
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

  /**
   * Generates a concrete item instance with randomized stat rolls based on rarity.
   */
  static createItem(templateKey, overrideRarity = null) {
    const tmpl = ITEM_TEMPLATES[templateKey];
    if (!tmpl) return null;

    const rarityKey = overrideRarity || tmpl.baseRarity;
    const rarity = this.getRarity(rarityKey);
    const id = 'item_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 5);

    // Roll stats with +/- 15% variation multiplied by rarity
    const finalStats = {};
    for (const [sKey, sVal] of Object.entries(tmpl.baseStats)) {
      if (sKey === 'atkCooldown') {
        finalStats[sKey] = Number((sVal * (1 + (rarity.multiplier - 1) * 0.25)).toFixed(2));
      } else {
        const variance = 0.88 + Math.random() * 0.24; // 88% - 112%
        finalStats[sKey] = Math.max(1, Math.round(sVal * variance * (rarity.multiplier / (RARITY_TIERS[tmpl.baseRarity]?.multiplier || 1))));
      }
    }

    // Roll additional random affixes depending on rarity
    const affixes = [];
    const usedAffixKeys = new Set(Object.keys(finalStats));
    const availableAffixes = RANDOM_AFFIXES.filter(a => !usedAffixKeys.has(a.key));

    const affixCount = Math.min(rarity.affixCount, availableAffixes.length);
    // Shuffle available affixes
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

    return {
      id,
      key: templateKey,
      templateKey,
      name: tmpl.name,
      slot: tmpl.slot,
      category: tmpl.category || (tmpl.slot === 'consumable' ? 'potion' : 'equip'),
      itemType: tmpl.itemType || null,
      count: tmpl.count || 1,
      maxStack: tmpl.maxStack || (tmpl.slot === 'consumable' ? 99 : 1),
      icon: tmpl.icon,
      wingStyle: tmpl.wingStyle || null,
      rarity: rarityKey,
      stats: finalStats,
      affixes,
      lore: tmpl.lore,
      value: tmpl.value || Math.round(40 * rarity.multiplier + (Math.random() * 20))
    };
  }

  /**
   * Generates a random drop tailored to the monster tier or chest.
   */
  static rollDrop(sourceType = 'normal', level = 1) {
    // 1. Select Rarity
    let rWeights;
    if (sourceType === 'boss') {
      rWeights = { rare: 35, epic: 50, legendary: 15 };
    } else if (sourceType === 'chest') {
      rWeights = { magic: 40, rare: 45, epic: 15 };
    } else if (sourceType === 'buffalo' || sourceType === 'elite') {
      rWeights = { magic: 45, rare: 40, epic: 15 };
    } else {
      // Normal monsters
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

    // 2. Select Suitable Item Template
    const templateKeys = Object.keys(ITEM_TEMPLATES);
    // Filter templates by slot or thematic preference
    let eligible = templateKeys.filter(k => {
      const tmpl = ITEM_TEMPLATES[k];
      return tmpl.baseRarity === chosenRarity || chosenRarity !== 'legendary';
    });

    if (eligible.length === 0) eligible = templateKeys;
    const chosenKey = eligible[Math.floor(Math.random() * eligible.length)];

    return this.createItem(chosenKey, chosenRarity);
  }
}

window.RARITY_TIERS = RARITY_TIERS;
window.ITEM_TEMPLATES = ITEM_TEMPLATES;
window.ItemSystem = ItemSystem;

