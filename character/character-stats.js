/*global gs, game, console*/
/*global PlayerCharacter, Character, NPC*/
/*global PLAYER_INITIAL_HP, PLAYER_INITIAL_MP, PLAYER_INITIAL_MAX_FOOD*/
/*global PLAYER_HP_PER_LEVEL, PLAYER_MP_PER_LEVEL*/
/*global RANGE_MULTIPLIER_PER_SKILL, SPELL_MULTIPLIER_PER_SKILL, STEALTH_PER_SKILL*/
/*global SAVE_AMMO_PER_SKILL, HP_PER_SKILL, MP_PER_SKILL*/
/*global HP_REGEN_TIME, MP_REGEN_TIME, CRITICAL_PERCENT, MAX_RAGE, RAGE_DECREASE_TURNS*/
/*global MAX_DEFENSE, CHARACTER_SIZE, CRIT_MULTIPLIER*/
/*global MOVE_TIME, RAGE_POINT_PERCENT*/
/*global MAX_EVASION_PERCENT, EVASION_PERCENT_PER_POINT*/
/*global CRIT_PERCENT_PER_STEALTH*/
/*global RESISTANCE_MULTIPLIER*/
/*global MAX_REFLECTION_PERCENT, REFLECTION_PERCENT_PER_POINT*/
/*jshint esversion: 6*/
'use strict';



// UPDATE_STATS_BASE:
// ************************************************************************************************
Character.prototype.updateStatsBase = function () {
	var key;
	
	// Zero Out Bonus Stats:
	this.bonusMaxHp = 0;
	this.bonusMaxMp = 0;
	this.bonusMaxFood = 0;
	this.bonusExpMod = 0;
	this.bonusGoldMod = 0;
	this.bonusDamageShield = 0;
	this.bonusMeleeRange = 0;
	this.bonusProjectileRange = 0;
	this.bonusMovementSpeed = 0;
	this.bonusSaveAmmoChance = 0;
	this.bonusSaveManaChance = 0;
	this.bonusReflection = 0;
	this.bonusEvasion = 0;
	this.bonusHpRegenTime = 0;
	this.bonusMpRegenTime = 0;
	this.maxHpModifier = 0;
	this.meleeLifeTap = 0;
	this.critMultiplier = CRIT_MULTIPLIER;
	
	// Flaggy type stuff:
	// Using integers in the case that multiple effects want to set this same flag (they can all just increment by 1);
	// Also because equipment works by adding to the stat (an integer)
	this.isFlying = 0;
	this.isTelepathic = 0;
	this.hasLifeSaving = 0;
	this.hasInferno = 0;
	this.hasThunder = 0;
	this.hasRage = 0;
	this.isConfused = 0;
	this.isSlowProjectile = this.type.isSlowProjectile;
	
	// Mostly status effects:
	this.isMultiMoving = 0;
	this.alwaysCrit = 0;
	this.alwaysProjectileCrit = 0;
	this.knockBackOnHit = 0;
	this.isWet = 0;
	this.isFlammable = 0;
	this.isUnstable = 0;
	this.isStunned = 0;
	this.isMarked = 0;
	this.isImmobile = 0;
	this.hasKeenHearing = 0;
	
	if (this.type.cantMove) {
		this.isImmobile = 1;
	}
	
	// Size:
	this.size = this.type.size;
	
	// Weapons:
	this.meleePower = 0;
	this.rangePower = 0;
	this.maxRage = MAX_RAGE;
	
	// Stealth:
	this.stealth = 0;
	this.stealthModifier = 0;
	
	// Spells:
	this.firePower = 0;
	this.coldPower = 0;
	this.toxicPower = 0;
	this.stormPower = 0;
	this.spellPower = 0;
	this.spellPowerModifier = 0;
	this.manaConservation = {Fire: 0, Cold: 0, Toxic: 0, Storm: 0};
	
	// Resistance:
	this.protection = this.type.protection;
	this.resistance.Fire = this.type.resistance.Fire;
	this.resistance.Cold = this.type.resistance.Cold;
	this.resistance.Shock = this.type.resistance.Shock;
	this.resistance.Toxic = this.type.resistance.Toxic;
	this.blockChance = 0;
	this.parryChance = 0;
	
	// Attributes:
	this.strength = this.baseStrength;
	this.dexterity = this.baseDexterity;
	this.intelligence = this.baseIntelligence;
	
	// Class:
	if (this.characterClass && gs.classEffects[this.characterClass]) {
		gs.classEffects[this.characterClass](this);
	}
	
	// Race:
	if (this.race) {
		this.race.effect(this);
	}
	
	// Equipment:
	if (this.inventory) {
		this.inventory.onUpdateStats();
	}
	
	// NPC Class:
	if (this.npcClassType && this.npcClassType.effect) {
		this.npcClassType.effect(this);
	}
	
	// Status Effects:
	this.statusEffects.onUpdateStats();
	
	
	// Talents:
	if (this.talents) {
		this.talents.forEach(function (talent) {
			if (talent.type.effect) {
				talent.type.effect(this);
			}
		}, this);
	}
	
	// Sustained Abilities:
	this.abilities.list.forEach(function (ability) {
		if (ability && ability.isOn) {		
			if (ability.type.sustainedEffect) {
				ability.type.sustainedEffect(this);
			}
			this.bonusMaxMp -= ability.type.mana;
		}
	}, this);
	
	// Sustained Summons:
	this.getActiveSummonList().forEach(function (char) {
		if (char.type.sustainedMpCost) {
			this.bonusMaxMp -= char.type.sustainedMpCost;
		}
	}, this);
	
	// Religion:
	if (this.religion && gs.religionTypes[this.religion].effect) {
		gs.religionTypes[this.religion].effect(this);
	}
	
	// Spell Power:
	this.spellPower += (this.intelligence - 10);
	this.spellPower += this.skills.SpellCasting;
	
	// Magic Power:
	this.firePower += this.spellPower;
	this.coldPower += this.spellPower;
	this.stormPower += this.spellPower;
	this.toxicPower += this.spellPower;
	
	// Magic Modifier (penalty):
	this.firePower = Math.floor(this.firePower + this.firePower * this.spellPowerModifier);
	this.coldPower = Math.floor(this.coldPower + this.coldPower * this.spellPowerModifier);
	this.stormPower = Math.floor(this.stormPower + this.stormPower * this.spellPowerModifier);
	this.toxicPower = Math.floor(this.toxicPower + this.toxicPower * this.spellPowerModifier);
	this.spellPower = Math.floor(this.spellPower + this.spellPower * this.spellPowerModifier);
	
	// Magic Damage Multipliers:
	this.fireDamageMultiplier =		1.0 + this.firePower * 0.05;
	this.coldDamageMultiplier =		1.0 + this.coldPower * 0.05;
	this.shockDamageMultiplier =	1.0 + this.stormPower * 0.05;
	this.toxicDamageMultiplier = 	1.0 + this.toxicPower * 0.05;
	this.spellDamageMultiplier =	1.0 + this.spellPower * 0.05;
	
	// Melee damage multiplier:
	this.meleePower += (this.strength - 10);
	this.meleePower += this.skills.Melee;
	
	// Rage damage multiplier:
	if (this.hasRage && this.rage > 0) {
		this.meleePower += this.rage;
	}
	
	this.meleeDamageMultiplier = 1.0 + this.meleePower * 0.05;
	
	// Range damage multiplier:
	this.rangePower += (this.dexterity - 10);
	this.rangePower += this.skills.Range;
	this.rangeDamageMultiplier = 1.0 + this.rangePower * 0.05;
	
	
	// Evasion:
	this.evasion = this.type.evasion;
	this.evasion += this.bonusEvasion;
	this.evasion += Math.floor( (this.dexterity - 10) / 2);
	
	// Stealth:
	this.stealth += (this.dexterity - 10);
	this.stealth += this.skills.Stealth;
	this.stealth = Math.floor(this.stealth + this.stealth * this.stealthModifier);
	
	// Adrenaline:
	if (this.hasTalent('Adrenaline') && this.currentHp <= this.maxHp / 3) {
		this.bonusSaveManaChance += 0.5;
	}
	
	// Other Stats:
	this.damageShield = this.type.damageShield + this.bonusDamageShield;
	this.saveAmmoChance = this.bonusSaveAmmoChance;
	this.saveManaChance = this.bonusSaveManaChance;
	this.reflection = this.type.reflection + this.bonusReflection;
	
	// Crit Multiplier:
	this.critMultiplier += this.stealth * CRIT_PERCENT_PER_STEALTH;
	
	
	if (this.type.isFlying) {
		this.isFlying += 1;
	}
	
	// Movement:
	this.movementSpeed = Math.max(0, Math.min(2, this.type.movementSpeed + this.bonusMovementSpeed));
	this.moveTime = MOVE_TIME[this.movementSpeed];
};

// UPDATE_STATS
// ************************************************************************************************
NPC.prototype.updateStats = function () {
	this.updateStatsBase();
	
	if (this.type.hitPointType) {
		this.maxHp = gs.npcMaxHp(this.level, this.type.hitPointType);
	}
	else {
		this.maxHp = this.type.maxHp;
	}
	
	this.maxHp += this.bonusMaxHp;
	
	this.hpRegenTime = Math.round(HP_REGEN_TIME / this.maxHp);
	this.mpRegenTime = Math.round(MP_REGEN_TIME / this.maxMp);
};

// PLAYER_UPDATE_STATS:
// ************************************************************************************************
PlayerCharacter.prototype.updateStats = function () {
	this.updateStatsBase();
	
	// Initial:
	this.maxHp = PLAYER_INITIAL_HP[this.characterClass];
	this.maxMp = PLAYER_INITIAL_MP[this.characterClass];
	
	// Level Contribution:
	this.maxHp += (this.level - 1) * PLAYER_HP_PER_LEVEL[this.characterClass];
	this.maxMp += (this.level - 1) * PLAYER_MP_PER_LEVEL[this.characterClass];
	
	// Additional Bonuses:
	this.maxHp += this.bonusMaxHp;
	this.maxMp += this.bonusMaxMp;
	
	// Attribute Bonus:
	this.maxHp += (this.strength - 10) * 2;
	this.maxMp += (this.intelligence - 10);
	
	// Skill Bonus:
	this.maxHp += this.skills.Fortitude * 2;
	this.maxMp += this.skills.Focus;
	
	// Permanent Bonus:
	this.maxHp += this.permanentHpBonus;
	this.maxMp += this.permanentMpBonus;
	
	// Modifier:
	this.maxHp += this.maxHp * this.maxHpModifier;
	
	// Round:
	this.maxHp = Math.round(this.maxHp);
	this.maxMp = Math.round(this.maxMp);
	
	// Barbarian (no mana):
	if (this.characterClass === 'Barbarian') {
		this.maxMp = 0;
	}
	
	this.maxFood = PLAYER_INITIAL_MAX_FOOD + this.bonusMaxFood;
	this.expMod = 1 + this.bonusExpMod;
	this.goldMod = 1 + this.bonusGoldMod;
	
	// Shield Wall:
	if (this.hasTalent('ShieldWall') && this.inventory.hasShieldEquipped()) {
		gs.getIndexListAdjacent(this.tileIndex).forEach(function (tileIndex) {
			if (!gs.isStaticPassable(tileIndex)) {
				this.protection += 1;
			}
		}, this);
	}
	
	// Make sure to remove sustained effects if player does not have enough mana:
	while (this.maxMp < 0 && this.abilities.list.find(ability => ability && ability.isOn)) {
		let ability = this.abilities.list.find(ability => ability && ability.isOn);
		ability.isOn = false;
		this.maxMp += ability.type.mana;
	}
	
	
	// Cap Stats:
	this.capStats();
	
	// In case player removes a flying item while over a pit:
	// Note: must check if there is even a tile there in the case that the player is updating his stats before map is created
	if (gs.hasGameStarted && gs.getTile(this.tileIndex) && gs.isPit(this.tileIndex) && !this.isFlying) {
		if (gs.state === 'CHARACTER_MENU_STATE') {
			gs.characterMenu.close();
		}
		this.fallDownPit();
	}
	
	// Regen:
	this.hpRegenTime = 10 - this.bonusHpRegenTime;
	this.mpRegenTime = 15 - this.bonusMpRegenTime;
};


// CAP_STATS:
// ************************************************************************************************
Character.prototype.capStats = function () {
	this.maxHp = Math.max(0, this.maxHp);
	this.maxMp = Math.max(0, this.maxMp);
	
	this.currentFood = Math.min(this.currentFood, this.maxFood);
	this.currentHp = Math.min(this.currentHp, this.maxHp);
	this.currentMp = Math.min(this.currentMp, this.maxMp);
	
	// Resistance Cap:
	this.resistance.Shock = Math.min(this.resistance.Shock, 3);
	this.resistance.Fire = Math.min(this.resistance.Fire, 3);
	this.resistance.Cold = Math.min(this.resistance.Cold, 3);
	this.resistance.Toxic = Math.min(this.resistance.Toxic, 3);
	
	this.hpRegenTime = Math.max(this.hpRegenTime, 1);
	this.mpRegenTime = Math.max(this.mpRegenTime, 1);
	
	this.size = Math.max(CHARACTER_SIZE.SMALL, Math.min(CHARACTER_SIZE.LARGE, this.size));
};

// WEAPON_DAMAGE:
// ************************************************************************************************
PlayerCharacter.prototype.weaponDamage = function (weapon) {
	var damage;
	
	weapon = weapon || this.inventory.getWeapon();
	
	damage = weapon.getModdedStat('damage');
	
	// Magic Staff:
	if (weapon.type.attackEffect === gs.weaponEffects.MagicStaff) {
		if (gs.projectileTypes[weapon.type.projectileName].damageType === 'Fire') {
			damage *= this.fireDamageMultiplier;
		}
		else if (gs.projectileTypes[weapon.type.projectileName].damageType === 'Cold') {
			damage *= this.coldDamageMultiplier;
		}
		else if (gs.projectileTypes[weapon.type.projectileName].damageType === 'Toxic') {
			damage *= this.toxicDamageMultiplier;
		}
		else if (gs.projectileTypes[weapon.type.projectileName].damageType === 'Shock') {
			damage *= this.shockDamageMultiplier;
		}
		else if (gs.projectileTypes[weapon.type.projectileName].damageType === 'Physical') {
			damage *= this.spellDamageMultiplier;
		}
	}
	// Melee Weapon:
	else if (weapon.type.attackEffect.skill === 'Melee') {
		damage *= this.meleeDamageMultiplier;
	}
	// Range Weapon:
	else if (weapon.type.attackEffect.skill === 'Range') {
		damage *= this.rangeDamageMultiplier;
	}
	
	damage = Math.round(damage);
	
	return damage;
};

// WEAPON_RANGE:
// ************************************************************************************************
PlayerCharacter.prototype.weaponRange = function (weapon) {
	var range;
	
	weapon = weapon || this.inventory.getWeapon();
	
	// Melee:
	if (weapon.type.attackEffect.skill === 'Melee') {
		range = weapon.type.range + this.bonusMeleeRange;
	}
	// Range:
	else if (weapon.type.attackEffect.skill === 'Range') {
		range = weapon.type.range + this.bonusProjectileRange;
	}
	
	return range;
};

// WEAPON_MIN_RANGE:
// ************************************************************************************************
PlayerCharacter.prototype.weaponMinRange = function (weapon) {
	weapon = weapon || this.inventory.getWeapon();
	
	// Elves have no minRange:
	if (this.race.name === 'Elf') {
		return 0;
	}
	else {
		return weapon.type.minRange;
	}
};

// DODGE_PERCENT:
// ************************************************************************************************
Character.prototype.dodgePercent = function () {
	return Math.min(MAX_EVASION_PERCENT, this.evasion * EVASION_PERCENT_PER_POINT);
};

// REFLECT_PERCENT:
// ************************************************************************************************
Character.prototype.reflectPercent = function () {
	return Math.min(MAX_REFLECTION_PERCENT, this.reflection * REFLECTION_PERCENT_PER_POINT);
};

// GET_STAT_DESC:
// ************************************************************************************************
PlayerCharacter.prototype.getStatDesc = function (tag) {
	var str = '';
	
	if (tag === 'Strength') {
		str += '??????:\n';
		str += '??????10???????????????\n??????????????????????????????+2?????????+1???????????????';
	}
	else if (tag === 'Dexterity') {
		str += '??????:\n';
		str += '??????10???????????????\n??????????????????????????????+1?????????+1???????????????\n';
		str += '???????????????2??????????????????+1?????????';
	}
	else if (tag === 'Intelligence') {
		str += '??????:\n';
		str += '??????10???????????????\n??????????????????????????????+1????????????+1???????????????';
	}
	else if (tag === 'Protection') {
		str += '??????:\n';
		
		if (this.protection > 0) {
			str += '??????????????????????????????\n??????????????????????????????0-' + this.protection + '??????';
		}
		else {
			str += '????????????????????????????????????????????????????????????0??????';
		}
	}
	else if (tag === 'Evasion') {
		str += '??????:\n';
		str += '????????????????????????' + gs.toPercentStr(EVASION_PERCENT_PER_POINT) + '???????????????????????????????????????\n???????????????' + gs.toPercentStr(MAX_EVASION_PERCENT) + '???\n';
		str += '????????????????????????' + gs.toPercentStr(this.dodgePercent()) + '??????????????????';
	}
	else if (tag === 'Reflection') {
		str += '??????:\n';
		str += '????????????????????????' + gs.toPercentStr(REFLECTION_PERCENT_PER_POINT) + '??????????????????????????????\n???????????????' + gs.toPercentStr(MAX_REFLECTION_PERCENT) + '???\n';
		str += '????????????????????????' + gs.toPercentStr(this.reflectPercent()) + '??????????????????';
	}
	else if (tag === 'Stealth') {
		str += '??????:\n';
		str += '?????????????????????????????????????????????\n';
		str += '????????????????????????' + gs.toPercentStr(CRIT_PERCENT_PER_STEALTH) + '??????????????????';
	}
	else if (tag === 'FireResistance') {
		str += '?????????:\n';
		str += '?????????????????????' + gs.toPercentStr(RESISTANCE_MULTIPLIER[this.resistance.Fire] / 2) + '??????????????????';
	}
	else if (tag === 'ColdResistance') {
		str += '?????????:\n';
		str += '?????????????????????' + gs.toPercentStr(RESISTANCE_MULTIPLIER[this.resistance.Cold] / 2) + '??????????????????';
	}
	else if (tag === 'ShockResistance') {
		str += '?????????:\n';
		str += '?????????????????????' + gs.toPercentStr(RESISTANCE_MULTIPLIER[this.resistance.Shock] / 2) + '??????????????????';
	}
	else if (tag === 'ToxicResistance') {
		str += '?????????:\n';
		str += '?????????????????????' + gs.toPercentStr(RESISTANCE_MULTIPLIER[this.resistance.Toxic] / 2) + '???????????????';
	}
	else if (tag === 'MeleePower') {
		str += '????????????:\n';
		str += '???????????????????????????5%??????????????????\n';
		str += '????????????????????????????????????+' + gs.toPercentStr(this.meleeDamageMultiplier - 1) + '????????????????????????';
		
	}
	else if (tag === 'RangePower') {
		str += '????????????:\n';
		str += '????????????????????????????????????????????????\n????????????5%??????????????????\n';
		str += '????????????????????????????????????+' + gs.toPercentStr(this.rangeDamageMultiplier - 1) + '????????????????????????';
		
	}
	else if (tag === 'SpellPower') {
		str += '????????????:\n';
		str += '???????????????????????????5%????????????????????????????????????\n';
		str += '????????????????????????????????????+' + gs.toPercentStr(this.spellDamageMultiplier - 1) + '????????????????????????';
	}
	else if (tag === 'FirePower') {
		str += '???????????????:\n';
		str += '???????????????????????????????????????????????????\n??????????????????????????????5%???\n';
		str += '???????????????????????????????????????+' + gs.toPercentStr(this.fireDamageMultiplier - 1) + '???????????????????????????';
	}
	else if (tag === 'ColdPower') {
		str += '???????????????:\n';
		str += '??????????????????????????????????????????????????????\n??????????????????????????????5%???\n';
		str += '???????????????????????????????????????+' + gs.toPercentStr(this.coldDamageMultiplier - 1) + '???????????????????????????';
	}
	else if (tag === 'StormPower') {
		str += '??????????????????:\n';
		str += '????????????????????????????????????????????????????????????\n??????????????????????????????5%???\n';
		str += '??????????????????????????????????????????+' + gs.toPercentStr(this.shockDamageMultiplier - 1) + '??????????????????????????????';
	}
	else if (tag === 'ToxicPower') {
		str += '???????????????:\n';
		str += '???????????????????????????????????????????????????\n??????????????????????????????5%???\n';
		str += '???????????????????????????????????????+' + gs.toPercentStr(this.toxicDamageMultiplier - 1) + '???????????????????????????';
	}
	
	return str;
};