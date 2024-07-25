// Author  : Daniel Salim
// Version : 1.1.1 (30 November 2023)
// Description : This component is used for qek popup

import React, { useState, useEffect, useRef } from "react";
import Header from "../global/Header";
import Button from "../global/Button"

import INITRAMAIR from "../../Assets/InitRamAir.svg"
import INITNRTPTAIR from "../../Assets/InitNrtPtAir.svg"
import INITNRTBRNAIR from "../../Assets/InitNrtBrnAir.svg"
import INITNRTALTAIR from "../../Assets/InitNrtAltAir.svg"

import INITRAMSUR from "../../Assets/InitRamSur.svg"
import INITNRTPTSUR from "../../Assets/InitNrtPtSur.svg"
import INITNRTBRNSUR from "../../Assets/InitNrtBrnSur.svg"
import INITNRTALTSUR from "../../Assets/InitNrtAltSur.svg"

import INITRAMSUB from "../../Assets/InitRamSub.svg"
import INITNRTPTSUB from "../../Assets/InitNrtPtSub.svg"
import INITNRTBRNSUB from "../../Assets/InitNrtBrnSub.svg"
import INITNRTALTSUB from "../../Assets/InitNrtAltSub.svg"

import INITRAMLAND from "../../Assets/InitRamLand.svg"
import INITNRTPTLAND from "../../Assets/InitNrtPtLand.svg"
import INITNRTBRNLAND from "../../Assets/InitNrtBrnLand.svg"
import INITNRTALTLAND from "../../Assets/InitNrtAltLand.svg"

const QEK = ({ handleClose, setTrackType, setDeleteTracksType, setLastUpdateType }) => {
    // Dragging Function and click outisde to close
    const modalRef = useRef(null)
    const headerRef = useRef(null)
    const [isDragging, setIsDragging] = useState(false);
    const [offset, setOffset] = useState({ x: null, y: null });
    const [modalPosition, setModalPosition] = useState({ left: 0, top: 0 });

    const handleMouseDown = (e) => {
        if (headerRef.current.contains(e.target)) {
            setIsDragging(true);
            setOffset({
                x: e.clientX,
                y: e.clientY,
            });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging) {
            modalRef.current.style.top = modalPosition.top + (e.clientY - offset.y) + "px";
            modalRef.current.style.left = modalPosition.left + (e.clientX - offset.x) + "px";
        }
    };

    const handleMouseUp = (e) => {
        setIsDragging(false);
        document.onmousemove = null
        document.onmouseup = null
        setModalPosition({
            left: modalPosition.left + (e.clientX - offset.x),
            top: modalPosition.top + (e.clientY - offset.y)
        })
    };

    document.onmousemove = handleMouseMove;
    //-------------- End of Dragging Function and click outisde to close --------------//

    const TrackAirMode = ["INIT RAMAIR", "INIT NRT PTAIR", "INIT NRT BRNAIR", "INIT NRT ALTAIR"]
    const SurfaceMode = ["INIT RAMSUR", "INIT NRT PTSUR", "INIT NRT BRNSUR", "INIT NRT ALTSUR"]
    const SubsurfaceMode = ["INIT RAMSUB", "INIT NRT PTSUB", "INIT NRT BRNSUB", "INIT NRT ALTSUB"]
    const LandMode = ["INIT RAMLAND", "INIT NRT PTLAND", "INIT NRT BRNLAND", "INIT NRT ALTLAND"]

    const [activeRAC, setRAC] = useState("TrackAirMode");
    const [activeINIT, setINIT] = useState("");

    const initMap = {
        INITRAMAIR,
        INITNRTPTAIR,
        INITNRTBRNAIR,
        INITNRTALTAIR,
        INITRAMSUR,
        INITNRTPTSUR,
        INITNRTBRNSUR,
        INITNRTALTSUR,
        INITRAMSUB,
        INITNRTPTSUB,
        INITNRTBRNSUB,
        INITNRTALTSUB,
        INITRAMLAND,
        INITNRTPTLAND,
        INITNRTBRNLAND,
        INITNRTALTLAND,
    };

    const modesMap = {
        TrackAirMode,
        SurfaceMode,
        SubsurfaceMode,
        LandMode,
    };


    useEffect(() => {
        if (activeINIT !== "") {
            const trimmedINIT = activeINIT.trim();
            const cleanINIT = trimmedINIT.replace(/\s+/g, '');
            setTrackType(initMap[cleanINIT]);
            return
        }
        setTrackType(null);
    }, [activeINIT]);

    const ModeButtons = ({ modes }) => {
        const selectedModes = modesMap[modes] || [];
        return (
            <>
                {selectedModes.map((mode, index) => (
                    <Button
                        key={index}
                        label={mode}
                        clickHandler={() => setINIT(mode)}
                        className={`rac ${activeINIT === mode ? "bg-rac-top-choice" : "bg-init"}`}
                    />
                ))}
            </>
        );
    };

    const handleRemoveButton = () => {
        setINIT("");
        const trimmedINIT = activeINIT.trim();
        const cleanINIT = trimmedINIT.replace(/\s+/g, '');
        setLastUpdateType("delete")
        setDeleteTracksType(initMap[cleanINIT]);
    }

    return (
        <>
            {/*content*/}
            <div className="inset-0 items-center justify-center mt-60">
                {/*header*/}
                <div ref={modalRef} className={`relative my-auto mx-auto w-rac`}>
                    <div>
                        <div ref={headerRef} onMouseUp={handleMouseUp} onMouseDown={handleMouseDown} onMouseEnter={!isDragging ? () => headerRef.current.style.cursor = "move" : null} onMouseLeave={!isDragging ? () => headerRef.current.style.cursor = "default" : null}>
                            <Header clickHandler={handleClose} />
                        </div>
                        <div className="rounded-b-lg p-5 bg-high-container">
                            <div className="flex flex-row justify-start pb-4 gap-2.5">
                                <Button label={"Track Air"} clickHandler={() => setRAC("TrackAirMode")} className={`rac font-bold ${activeRAC === "TrackAirMode" && "bg-rac-top-choice"}`} />
                                <Button label={"Surface"} clickHandler={() => setRAC("SurfaceMode")} className={`rac font-bold ${activeRAC === "SurfaceMode" && "bg-rac-top-choice"}`} />
                                <Button label={"Subsurface"} clickHandler={() => setRAC("SubsurfaceMode")} className={`rac font-bold ${activeRAC === "SubsurfaceMode" && "bg-rac-top-choice"}`} />
                                <Button label={"Land"} clickHandler={() => setRAC("LandMode")} className={`rac font-bold ${activeRAC === "LandMode" && "bg-rac-top-choice"}`} />
                            </div>
                            <div className="flex flex-row flex-wrap justify-start pb-4 gap-2.5">
                                <ModeButtons modes={activeRAC} />
                                {activeINIT &&
                                    <Button label={`Remove All ${activeINIT} RAC tracks`} clickHandler={handleRemoveButton} className={`rac w-96 mt-5 bg-init hover:bg-gray-400`} />
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default QEK;

