const { RtcTokenBuilder, RtmTokenBuilder, RtcRole, RtmRole } = require('agora-access-token')




const tokenGenerator = async (req, res, next) => {

    console.log(req.body)

    const { channelName, id, participantRole } = req.body




    const role = participantRole === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    const expirationTimeInSeconds = 7200
    const currentTimestamp = Math.floor(Date.now() / 1000)
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds

    const tokenA = RtcTokenBuilder.buildTokenWithAccount(process.env.appId, process.env.appCertificate, channelName, id, role, privilegeExpiredTs);
    console.log("Token with integer number Uid: ", tokenA);

    res.json({
        token: tokenA,
        channelName: channelName
    })

}


module.exports = {
    tokenGenerator
}