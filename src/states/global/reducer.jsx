import { ActionType, setIsGeneratingRoute } from "./action";

const initialState = {
    isSwapClicked: "",
    isNodeValid: "",
    isNewRoute: "",
    isGeneratingRoute: ""
};

function globalReducer(state = initialState, action = {}) {
    switch (action.type) {
        case ActionType.SET_IS_SWAP_CLICKED:
            return {
                ...state,
                isSwapClicked: action.payload
            }
        case ActionType.IS_NODE_VALID:
            return {
                ...state,
                isNodeValid: action.payload.isNodeValid
            }
        case ActionType.IS_NEW_ROUTE:
            return {
                ...state,
                isNewRoute: action.payload.isNewRoute
            }
        case ActionType.IS_GENERATING_ROUTE:
            return {
                ...state,
                isGeneratingRoute: action.payload.isGeneratingRoute
            }
        default:
            return state;
    }
}

export default globalReducer;   