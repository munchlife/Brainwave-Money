
// immunities.js

var Immunities = module.exports = {};

// -----------------------------------------------------------------------------
// TODO: convert to an enum or add to database
Immunities.AuthLevelAdminStakeholder   = 1;
Immunities.AuthLevelManagerStakeholder = 2;
Immunities.AuthLevelStakeholder        = 3;

// TODO: convert to an enum or add to database
Immunities.Denied             = 0;
Immunities.OwnerAccess        = 1;
Immunities.LifeAccess         = 2;
Immunities.BrainwaveAccess         = 3;
Immunities.BrainwaveInstanceAccess = 4;
Immunities.ServiceAccess         = 5;

// -----------------------------------------------------------------------------
Immunities.createAuthInfoPacket = function(tokenId, life, stakeholderMember) {
    return {
        tokenId: tokenId,
        life: life,
        stakeholderMember: stakeholderMember || null
    };
};

// -----------------------------------------------------------------------------
// LIFE
// -----------------------------------------------------------------------------
Immunities.verifyNoRejectionFromLife = function(lifeId, lifeAccess, brainwaveAccess, serviceAccess, lifePacket) {
    if (arguments.length !== 5 || !lifePacket || !(typeof lifePacket === 'object'))
        return Immunities.Denied;

    lifeId = Number(lifeId);

    if (lifePacket.life && lifeId === lifePacket.life.lifeId)
        return Immunities.OwnerAccess;
    else if (!!lifeAccess && lifePacket.life && lifePacket.stakeholderMember === null)
        return Immunities.LifeAccess;
    else if (!!brainwaveAccess && lifePacket.stakeholderMember && lifePacket.stakeholderMember.brainwaveId)
        return Immunities.BrainwaveAccess;
    else if (!!serviceAccess && lifePacket.stakeholderMember && lifePacket.stakeholderMember.serviceId)
        return Immunities.ServiceAccess;
    else
        return Immunities.Denied;
};

// -----------------------------------------------------------------------------
// CELL
// -----------------------------------------------------------------------------
Immunities.verifyNoRejectionFromBrainwave = function(brainwaveId, instanceId, authLevelRequired, lifeAccess, serviceAccess, lifePacket) {
    if (arguments.length !== 6 || !lifePacket || !(typeof lifePacket === 'object'))
        return Immunities.Denied;

    brainwaveId = Number(brainwaveId);
    if (instanceId !== null)
        instanceId = Number(instanceId);
    authLevelRequired = Number(authLevelRequired);

    // TODO: make sure immunity levels are correctly being allocated
    if (lifePacket.stakeholderMember &&
        brainwaveId === lifePacket.stakeholderMember.brainwaveId &&
        authLevelRequired >= lifePacket.stakeholderMember.immunities) {
        // brainwave endpoint with brainwave level stakeholder
        if (instanceId === null && lifePacket.stakeholderMember.instanceId === null)
            return Immunities.OwnerAccess;
        // instance endpoint with brainwave level stakeholder
        else if (instanceId !== null && lifePacket.stakeholderMember.instanceId === null)
            return Immunities.BrainwaveAccess;
        // brainwave endpoint with instance level stakeholder
        else if (instanceId === null || lifePacket.stakeholderMember.instanceId !== null)
            return Immunities.BrainwaveInstanceAccess;
        // instance endpoint with instance level stakeholder
        else if (instanceId === lifePacket.stakeholderMember.instanceId)
            return Immunities.OwnerAccess;
        else
            return Immunities.Denied;
    }
    else if (!!lifeAccess && lifePacket.stakeholderMember === null)
        return Immunities.LifeAccess;
    else if (!!serviceAccess && lifePacket.stakeholderMember && lifePacket.stakeholderMember.serviceId)
        return Immunities.ServiceAccess;
    else
        return Immunities.Denied;
};

Immunities.verifyNoRejectionFromBrainwave = function(brainwaveId, authLevelRequired, lifeAccess, instanceAccess, serviceAccess, lifePacket) {
    if (arguments.length !== 6 || !lifePacket || !(typeof lifePacket === 'object'))
        return Immunities.Denied;

    brainwaveId = Number(brainwaveId);
    authLevelRequired = Number(authLevelRequired);

    if (lifePacket.stakeholderMember &&
        lifePacket.stakeholderMember.brainwaveId === brainwaveId &&
        authLevelRequired >= lifePacket.stakeholderMember.immunities) {
        if (lifePacket.stakeholderMember.instanceId === null)
            return Immunities.OwnerAccess;
        else if (!!instanceAccess)
            return Immunities.BrainwaveInstanceAccess;
        else
            return Immunities.Denied;
    }
    else if (!!lifeAccess && lifePacket.stakeholderMember === null)
        return Immunities.LifeAccess;
    else if (!!serviceAccess && lifePacket.stakeholderMember && lifePacket.stakeholderMember.serviceId)
        return Immunities.ServiceAccess;
    else
        return Immunities.Denied;
};

Immunities.verifyNoRejectionFromBrainwaveInstance = function(brainwaveId, instanceId, authLevelRequired, lifeAccess, serviceAccess, lifePacket) {
    if (arguments.length !== 6 || !lifePacket || !(typeof lifePacket === 'object'))
        return Immunities.Denied;

    brainwaveId = Number(brainwaveId);
    instanceId = Number(instanceId);
    authLevelRequired = Number(authLevelRequired);

    if (lifePacket.stakeholderMember &&
        lifePacket.stakeholderMember.brainwaveId === brainwaveId &&
        authLevelRequired >= lifePacket.stakeholderMember.immunities) {
        if (lifePacket.stakeholderMember.instanceId === null)
            return Immunities.BrainwaveAccess;
        else if (lifePacket.stakeholderMember.instanceId === instanceId)
            return Immunities.OwnerAccess;
        else
            return Immunities.Denied;
    }
    else if (!!lifeAccess && lifePacket.stakeholderMember === null)
        return Immunities.LifeAccess;
    else if (!!serviceAccess && lifePacket.stakeholderMember && lifePacket.stakeholderMember.serviceId)
        return Immunities.ServiceAccess;
    else
        return Immunities.Denied;
};

// -----------------------------------------------------------------------------
// SERVICE
// -----------------------------------------------------------------------------
Immunities.verifyNoRejectionFromService = function(serviceId, authLevelRequired, lifeAccess, brainwaveAccess, lifePacket) {
    if (arguments.length !== 5 || !lifePacket || !(typeof lifePacket === 'object'))
        return Immunities.Denied;

    // Do not allow a service stakeholder to have an authorization level of 'manager'
    if (lifePacket.stakeholderMember && 
        lifePacket.stakeholderMember.serviceId &&
        lifePacket.stakeholderMember.immunities === Immunities.AuthLevelManagerStakeholder)
        return Immunities.Denied;

    serviceId = Number(serviceId);
    authLevelRequired = Number(authLevelRequired);

    if (lifePacket.stakeholderMember &&
        serviceId === lifePacket.stakeholderMember.serviceId &&
        authLevelRequired >= lifePacket.stakeholderMember.immunities)
        return Immunities.ServiceAccess;
    else if (!!lifeAccess && lifePacket.stakeholderMember === null)
        return Immunities.LifeAccess;
    else if (!!brainwaveAccess && lifePacket.stakeholderMember && lifePacket.stakeholderMember.brainwaveId)
        return Immunities.BrainwaveAccess;
    else
        return Immunities.Denied;
};
