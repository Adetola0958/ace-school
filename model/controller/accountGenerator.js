const accountNumber = (coll , currentValue , property , increment , padLength  ) => {
    try {
        let newAccountNumber
        if (Array.isArray(coll) ){
            if (coll.length !== 0){
                let lastRecord =  coll[coll.length - 1][property] 
                let charAtZero = lastRecord.charAt(0) 
                if (typeof charAtZero === "string") {
                    lastRecord = Number(lastRecord.slice(1 , lastRecord.length))
                }
                newAccountNumber = (String(lastRecord + increment)).padStart(padLength, "0")
                return newAccountNumber
            }else {
                newAccountNumber = currentValue 
                return newAccountNumber
            }
        }else {
            throw new Error("Provide an array of records")
        }
    }catch(error){
        return error
    }
} 
module.exports = accountNumber