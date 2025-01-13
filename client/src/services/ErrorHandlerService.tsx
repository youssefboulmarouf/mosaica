import { ethers } from 'ethers';
import MosaicaLib  from "../artifacts/contracts/MosaicaUtils.sol/MosaicaLib.json";

enum ErrorTypes {
    DexConnectorFoundError = "DexConnectorFoundError",
    DexConnectorNotFoundError = "DexConnectorNotFoundError",
    DexConnectorDisabledError = "DexConnectorDisabledError",
    DexConnectorEnabledError = "DexConnectorEnabledError",
    NotEnoughBalance = "NotEnoughBalance",
    IdenticalTokens = "IdenticalTokens",
    MissingEthValue = "MissingEthValue",
    ReceivedDifferentEthValueAndAmount = "ReceivedDifferentEthValueAndAmount",
    InvalidAddressError = "InvalidAddressError",
}
export default class ErrorHandlerService {
    
    static handleError = (err: any): string => {
        let errorMessage = "";
        if(err.code) {
            errorMessage = err.code
        } else if (err.data) {
            const mosaicaLib = new ethers.Interface(MosaicaLib.abi);
            const decodedError = mosaicaLib.parseError(err.data);
            
            errorMessage = this.formatErrorMessage(
                (decodedError) ? decodedError.name : "", 
                (decodedError) ? decodedError.args : [],
                err
            );
        } else {
            errorMessage = this.extractCode(err.message);
        }

        return errorMessage;
    }

    private static formatErrorMessage = (errorType: string, errorArgs: string[], err: any): string => {
        let errorMessage: string = "";
        switch (errorType) {
            case ErrorTypes.DexConnectorFoundError.toString():
                errorMessage = `Connector Contract with address ${errorArgs[0]} already found`;
                break;
            case ErrorTypes.DexConnectorNotFoundError.toString():
                errorMessage = `Connector Contract with address ${errorArgs[0]} not found`;
                break;
            case ErrorTypes.DexConnectorDisabledError.toString():
                errorMessage = `Connector Contract with address ${errorArgs[0]} is disabled`;
                break;
            case ErrorTypes.DexConnectorEnabledError.toString():
                errorMessage = `Connector Contract with address ${errorArgs[0]} is enabled`;
                break;
            case ErrorTypes.NotEnoughBalance.toString():
                errorMessage = `User does not have enough balance of token with address ${errorArgs[0]}`;
                break;
            case ErrorTypes.IdenticalTokens.toString():
                errorMessage = `Tokens provided for swap are indentical`;
                break;
            case ErrorTypes.MissingEthValue.toString():
                errorMessage = `Required ETH value`;
                break;
            case ErrorTypes.ReceivedDifferentEthValueAndAmount.toString():
                errorMessage = `Mismatch between the amount sent and the required amount of ETH`;
                break;
            case ErrorTypes.InvalidAddressError.toString():
                errorMessage = `Invalid address`;
                break;
        
            default:
                errorMessage = this.extractCode(err.message);
                break;
        }
        return errorMessage;
    }

    private static extractCode = (message: string): string => {
        const match = message.match(/code=([A-Z_]+)/);
        return match ? `An error occurred with code ${match[1]}.` : `Unknown error occurred - ${message}`;
    };
}