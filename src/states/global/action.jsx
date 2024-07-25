const ActionType = {
    SET_IS_SWAP_CLICKED: "SET_IS_SWAP_CLICKED",
    IS_NODE_VALID: "IS_NODE_VALID",
    IS_NEW_ROUTE: "IS_NEW_ROUTE",
}

function setIsSwapClicked(isSwapClicked) {
    return {
        type: ActionType.SET_IS_SWAP_CLICKED,
        payload: isSwapClicked
    }
}

function setIsNodeValid(isNodeValid) {
    return {
        type: ActionType.IS_NODE_VALID,
        payload: {
            isNodeValid
        }
    }
}

function setIsNewRoute(isNewRoute) {
    return {
        type: ActionType.IS_NEW_ROUTE,
        payload: {
            isNewRoute
        }
    }
}

export {
    ActionType,
    setIsSwapClicked,
    setIsNodeValid,
    setIsNewRoute
}