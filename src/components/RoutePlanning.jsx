import { setIsNodeValid, setIsGeneratingRoute } from '../states/global/action';
import { clearRoute, getRouteDispatch } from '../states/map/action';
import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import startIcon from '../assets/RiShip2Line.svg';
import endIcon from '../assets/FaLocationDot.svg';
import { toast } from 'react-toastify';
import { transform } from 'ol/proj';

import { IoMdInformationCircleOutline } from "react-icons/io";
import { BsFillExclamationCircleFill } from "react-icons/bs";
import { MdArrowDropDown } from "react-icons/md";
import { FaLocationDot } from "react-icons/fa6";
import { RiShip2Line } from "react-icons/ri";
import { FaTimes } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";

import 'react-toastify/dist/ReactToastify.css';
const turf = require('@turf/turf');

const RoutePlanning = ({ undoDrawing, isSelectingStart, isSelectingEnd, setIsSelectingStart, setIsSelectingEnd, startPoint, endPoint, setStartPoint, setEndPoint, map, setRoutePointType }) => {
    const dispatch = useDispatch();
    const abortControllerRef = useRef(null);

    const [startCoords, setStartCoords] = useState([]);
    const [endCoords, setEndCoords] = useState([]);
    const [showMoreParams, setShowMoreParams] = useState(false);
    const [showMoreInfo, setShowMoreInfo] = useState(true);
    const [hover, setHover] = useState(false);

    const [minimumDepth, setMinimumDepth] = useState(9.1);
    const [useMinimumDepth, setUseMinimumDepth] = useState(false);

    const [maxDistanceFromLand, setMaxDistanceFromLand] = useState(1205);
    const [useMaxDistanceFromLand, setMaxUseDistanceFromLand] = useState(false);

    const [minDistanceFromLand, setMinDistanceFromLand] = useState(5);
    const [useMinDistanceFromLand, setMinUseDistanceFromLand] = useState(false);

    const [neighborDistance, setNeighborDistance] = useState(150);
    const [useNeighborDistance, setUseNeighborDistance] = useState(false);

    const [speed, setSpeed] = useState(20);
    const [fuelConsumption, setFuelConsumption] = useState(5);

    const [departureTime, setDepartureTime] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');

    const lndarea = useSelector((state) => state.layers.s57.lndare);
    const depare = useSelector((state) => state.layers.s57.depare);
    const drgare = useSelector((state) => state.layers.s57.drgare);
    const wrecks = useSelector((state) => state.layers.s57.wrecks);
    const obstrn = useSelector((state) => state.layers.s57.obstrn);
    const boylat = useSelector((state) => state.layers.s57.boylat);
    const lights = useSelector((state) => state.layers.s57.lights);
    const routeLonLat = useSelector((state) => state.layers.route);
    const isGeneratingRoute = useSelector((state) => state.globalState.isGeneratingRoute);

    let timeEstimate = null;
    let totalFuelConsumption = null;

    const toggleMoreParams = () => {
        setShowMoreParams(!showMoreParams);
    };

    const toggleMoreInfo = () => {
        setShowMoreInfo(!showMoreInfo);
    };

    const handleDepthChange = (e) => {
        setMinimumDepth(e.target.value);
    };

    const handleMaxDistanceFromLandChange = (e) => {
        const newMaxDistance = parseInt(e.target.value, 10);

        // Ensure newMaxDistance is not less than minDistanceFromLand + 300
        if (newMaxDistance < minDistanceFromLand + 300) {
            // Set maxDistanceFromLand to minDistanceFromLand + 300
            setMaxDistanceFromLand(minDistanceFromLand + 300);
        } else {
            setMaxDistanceFromLand(newMaxDistance);
        }
    };

    const handleMinDistanceFromLandChange = (e) => {
        const newMinDistance = parseInt(e.target.value, 10);

        // Ensure newMinDistance is not greater than maxDistanceFromLand - 300
        if (newMinDistance > maxDistanceFromLand - 300) {
            // Set minDistanceFromLand to maxDistanceFromLand - 300
            setMinDistanceFromLand(maxDistanceFromLand - 300);
        } else {
            setMinDistanceFromLand(newMinDistance);
        }
    };

    const handleNeighborDistanceChange = (e) => {
        setNeighborDistance(e.target.value);
    };

    const handleSpeedChange = (e) => {
        const value = Math.max(0, e.target.value);
        setSpeed(value);
    };

    const handleFuelConsumptionChange = (e) => {
        const value = Math.max(1, Math.min(30000, e.target.value));
        setFuelConsumption(value);
    };

    const formatNumber = (number) => {
        return new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(number);
    };

    const formatDistance = (distance) => {
        if (distance < 1000) {
            return `${Math.round(distance)} m`;
        } else {
            return `${(distance / 1000).toFixed(2)} km`;
        }
    };

    const calculateTimeEstimate = (distance, speed) => {
        distance = distance / 1000; // Convert to km
        const totalHours = distance / (speed * 1.852); // Speed in knots to km/h
        const days = Math.floor(totalHours / 24);
        const hours = Math.floor(totalHours % 24);
        const minutes = Math.floor((totalHours * 60) % 60);

        return {
            totalHours: totalHours.toFixed(2),
            timeArray: [days, hours, minutes]
        };
    };

    const calculateFuelConsumption = (time, fuelConsumptionRate) => {
        const fuel = (time * fuelConsumptionRate).toFixed(2);
        return formatNumber(fuel);
    };

    if (routeLonLat && routeLonLat.distance) {
        timeEstimate = calculateTimeEstimate(routeLonLat.distance, speed);
        totalFuelConsumption = calculateFuelConsumption(timeEstimate.totalHours, fuelConsumption);
    }

    const handleDepartureTimeChange = (e) => {
        const departTime = e.target.value; // assuming this is in local time
        setDepartureTime(departTime);
        if (routeLonLat.distance && speed) {
            const departureDate = new Date(departTime);
            const timeOffset = departureDate.getTimezoneOffset();
            const totalMinutes = Math.floor(parseFloat(timeEstimate.totalHours) * 60);
            const arrival = new Date(departureDate.getTime() + totalMinutes * 60000);
            const localArrival = new Date(arrival.getTime() - timeOffset * 60000);
            setArrivalTime(localArrival.toISOString().slice(0, 16));
        }
    };


    const handleArrivalTimeChange = (e) => {
        const arriveTime = e.target.value;
        setArrivalTime(arriveTime);
        if (routeLonLat.distance && speed) {
            const arrivalDate = new Date(arriveTime);
            const timeOffset = arrivalDate.getTimezoneOffset();
            const totalMinutes = Math.floor(parseFloat(timeEstimate.totalHours) * 60);
            const departure = new Date(arrivalDate.getTime() - totalMinutes * 60000);
            const localDeparture = new Date(departure.getTime() - timeOffset * 60000);
            setDepartureTime(localDeparture.toISOString().slice(0, 16));
        }
    };

    const handleCancelRequest = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            dispatch(setIsGeneratingRoute("FINISHED"))
        }
    };

    const handleGenerateRoute = () => {
        let depth = useMinimumDepth ? minimumDepth : -3.3;
        let minDistance = useMinDistanceFromLand ? minDistanceFromLand : 5;
        let maxDistance = useMaxDistanceFromLand ? maxDistanceFromLand : 22224;
        let neighbor = useNeighborDistance ? neighborDistance : 150;

        abortControllerRef.current = new AbortController();
        const { signal } = abortControllerRef.current;

        dispatch(setIsGeneratingRoute("GENERATING"))
        dispatch(getRouteDispatch(startCoords, endCoords, depth, minDistance, maxDistance, neighbor, signal));
    }

    const showToast = (text) => {
        toast.error(text, {
            position: "bottom-left",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            icon: <BsFillExclamationCircleFill className="w-6 h-6" />,
            closeButton: <FaTimes style={{ color: "black" }} className="w-6 h-6" />,
        });
    }

    useEffect(() => {
        setArrivalTime('')
        setDepartureTime('')
    }, [totalFuelConsumption])

    useEffect(() => {
        if (routeLonLat) {
            dispatch(setIsGeneratingRoute("FINISHED"));
            abortControllerRef.current = null; // Clear the reference after the request is done
            if (fuelConsumption > 10 && minimumDepth !== 9.1) {
                toast.warning("Ship's fuel consumption rate is considered too high for the selected minimum depth. Please traverse carefully.", {
                    position: "bottom-left",
                    autoClose: 3000,
                    hideProgressBar: false,
                    closeOnClick: true,
                    pauseOnHover: true,
                    draggable: true,
                    progress: undefined,
                    icon: <BsFillExclamationCircleFill className="w-6 h-6" />,
                    closeButton: <FaTimes style={{ color: "black" }} className="w-6 h-6" />,
                });
            }
        }
    }, [routeLonLat])

    useEffect(() => {
        const handleMapClick = (evt) => {
            const coordinates = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
            const bufferDistance = 25;
            let isInWreckArea = false;
            let isInObstrnArea = false;
            let isInBoylatArea = false;
            let isInLightsArea = false;
            let isTooFarFromLand = true;
            let isTooCloseToLand = false;

            lndarea.forEach((feature) => {
                if ((isSelectingStart || isSelectingEnd) && turf.booleanPointInPolygon(turf.point(coordinates), feature.geometry)) {
                    dispatch(setIsNodeValid("IN LAND AREA"))
                    showToast("Selected point is inside a land area. Please select another location.")
                }
            });

            if (wrecks) {
                wrecks.forEach((feature) => {
                    const wreckArea = turf.buffer(feature.geometry, bufferDistance, { units: 'meters' });
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanIntersects(turf.point(coordinates), wreckArea)) {
                        isInWreckArea = true;
                    }
                });

                if ((isSelectingStart || isSelectingEnd) && isInWreckArea) {
                    dispatch(setIsNodeValid("IN WRECK AREA"))
                    showToast("Selected point is near a wreckage area. Please select another location.")
                }
            }

            if (obstrn) {
                obstrn.forEach((feature) => {
                    const obstrnArea = turf.buffer(feature.geometry, bufferDistance, { units: 'meters' });
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanIntersects(turf.point(coordinates), obstrnArea)) {
                        isInObstrnArea = true;
                    }
                });

                if ((isSelectingStart || isSelectingEnd) && isInObstrnArea) {
                    dispatch(setIsNodeValid("IN OBSTRUCTION AREA"))
                    showToast("Selected point is near an obstruction area. Please select another location.")

                }
            }

            if (boylat) {
                boylat.forEach((feature) => {
                    const boylatArea = turf.buffer(feature.geometry, bufferDistance, { units: 'meters' });
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanIntersects(turf.point(coordinates), boylatArea)) {
                        isInBoylatArea = true;
                    }
                });

                if ((isSelectingStart || isSelectingEnd) && isInBoylatArea) {
                    dispatch(setIsNodeValid("IN BOYAGE AREA"))
                    showToast("Selected point is near a buoy area. Please select another location.")
                }
            }

            if (lights) {
                lights.forEach((feature) => {
                    const lightsArea = turf.buffer(feature.geometry, bufferDistance, { units: 'meters' });
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanIntersects(turf.point(coordinates), lightsArea)) {
                        isInLightsArea = true;
                    }
                });

                if ((isSelectingStart || isSelectingEnd) && isInLightsArea) {
                    dispatch(setIsNodeValid("IN BOYAGE AREA"))
                    showToast("Selected point is near a light area. Please select another location.")
                }
            }

            if (useMinDistanceFromLand && minDistanceFromLand) {
                const circle = turf.buffer(turf.point(coordinates), minDistanceFromLand, { units: 'meters' });

                lndarea.forEach((feature) => {
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanIntersects(circle, feature.geometry)) {
                        isTooCloseToLand = true;
                    }
                });

                if ((isSelectingStart || isSelectingEnd) && isTooCloseToLand) {
                    dispatch(setIsNodeValid("IN TOO NEAR FROM LAND AREA"));
                    showToast("Selected point is too near from land. Please select another location.");
                }
            }

            if (useMaxDistanceFromLand && maxDistanceFromLand) {
                const circle = turf.buffer(turf.point(coordinates), maxDistanceFromLand, { units: 'meters' });

                lndarea.forEach((feature) => {
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanIntersects(circle, feature.geometry)) {
                        isTooFarFromLand = false;
                    }
                });

                if ((isSelectingStart || isSelectingEnd) && isTooFarFromLand) {
                    dispatch(setIsNodeValid("IN TOO FAR FROM LAND AREA"));
                    showToast("Selected point is too far from land. Please select another location.");
                }
            }

            if (useMinimumDepth && minimumDepth) {
                depare.forEach((feature) => {
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanPointInPolygon(turf.point(coordinates), feature.geometry) && minimumDepth > feature.properties.drval1) {
                        dispatch(setIsNodeValid("IN SHALLOW DEPTH AREA"))
                        showToast("Selected point is in shallow depth area. Please select another location.");
                    }
                })
                drgare.forEach((feature) => {
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanPointInPolygon(turf.point(coordinates), feature.geometry) && minimumDepth > feature.properties.drval1) {
                        dispatch(setIsNodeValid("IN SHALLOW DEPTH AREA"))
                        showToast("Selected point is in shallow depth area. Please select another location.");
                    }
                })
            }

            if (isSelectingStart) {
                setStartPoint(`${coordinates[0].toFixed(8)}, ${coordinates[1].toFixed(8)}`);
                setStartCoords(coordinates);
                setIsSelectingStart(false);
                if (isInBoylatArea || isInObstrnArea || isInWreckArea || isInLightsArea || useMinDistanceFromLand && isTooCloseToLand || useMaxDistanceFromLand && isTooFarFromLand) {
                    setStartPoint("")
                }
            } else if (isSelectingEnd) {
                setEndPoint(`${coordinates[0].toFixed(8)}, ${coordinates[1].toFixed(8)}`);
                setEndCoords(coordinates);
                setIsSelectingEnd(false);
                if (isInBoylatArea || isInObstrnArea || isInWreckArea || isInLightsArea || useMinDistanceFromLand && isTooCloseToLand || useMaxDistanceFromLand && isTooFarFromLand) {
                    setEndPoint("")
                }
            }
        };
        if (map) {
            map.on('click', handleMapClick);
        }

        return () => {
            if (map) {
                map.un('click', handleMapClick);
            }
        };
    }, [map, isSelectingStart, isSelectingEnd, minimumDepth, maxDistanceFromLand, useMaxDistanceFromLand, useMinimumDepth]);

    return (
        <div className="bg-primary-container rounded-2xl absolute left-0 top-0 mt-4 ml-6 w-sea-route">
            <div className="bg-primary-container text-white p-3 rounded-2xl flex justify-between items-center">
                <p className="mr-2 text-lg font-bold">Sea Route</p>
                <button
                    title='Undo'
                    id='undoDrawing'
                    className={` p-2.5 text-white cursor-pointer ml-1 mr-2 hover:text-gray-200`}
                    onClick={undoDrawing}
                    disabled={isGeneratingRoute === 'GENERATING'}
                >
                    <FaUndo />
                </button>
            </div>
            <div className="flex items-center mt-2 px-2">
                <button
                    title='Click to Select Start Point'
                    id='startPoint'
                    className={` p-2.5 bg-primary rounded-md text-white cursor-pointer ml-1 mr-2 shadow-md ${startPoint === "" ? 'hover:bg-dark-primary' : 'text-gray-400'} ${isSelectingStart ? 'bg-dark-primary' : ''}`}
                    onClick={() => {
                        if (startPoint === "") {
                            setRoutePointType(startIcon);
                            setIsSelectingStart(true);
                        } else {
                            return
                        }
                    }}
                >
                    <RiShip2Line />
                </button>
                <input
                    className="text-black p-2 rounded flex-1 mr-3"
                    type="text"
                    placeholder="Select Start Point"
                    value={startPoint}
                    readOnly
                    style={{ width: '250px' }}
                />
                {/* <MdMyLocation className="text-white cursor-pointer ml-2 " /> */}
            </div>
            <div className="flex items-center mt-2 px-2">
                <button
                    title='Click to Select End Point'
                    id='endPoint'
                    className={` p-2.5 bg-primary rounded-md text-white cursor-pointer ml-1 mr-2 shadow-md ${endPoint === "" ? 'hover:bg-dark-primary' : 'text-gray-400'} ${isSelectingEnd ? 'bg-dark-primary' : ''}`}
                    onClick={() => {
                        if (endPoint === "") {
                            setRoutePointType(endIcon)
                            setIsSelectingEnd(true);
                        }
                        else {
                            return
                        }
                    }}
                >
                    <FaLocationDot />
                </button>
                <input
                    className="text-black p-2 rounded flex-1 mr-3"
                    type="text"
                    placeholder="Select Destination Point"
                    value={endPoint}
                    readOnly
                    style={{ width: '250px' }}
                />
            </div>
            <div className="flex items-center mt-6 px-2">
                <MdArrowDropDown className="text-white w-5 h-5 mr-1 cursor-pointer" onClick={toggleMoreParams} />
                <p className="text-white font-bold text-sm cursor-pointer" onClick={toggleMoreParams}>Route Options</p>
            </div>
            {showMoreParams && (
                <div className='mt-5'>
                    <div className="flex justify-between items-center mt-4 px-2">
                        <label className="ml-1 text-white flex items-center text-sm" htmlFor="depth"                        >
                            <input
                                onClick={() => setUseMinimumDepth(!useMinimumDepth)}
                                type="checkbox"
                                checked={useMinimumDepth}
                                className="mr-2"
                                disabled={(startPoint || endPoint)}
                            />
                            Minimum Depth
                            <IoMdInformationCircleOutline className='ml-2' title='Adjust the minimum depth for ship to traverse. this is calculated relative to mean sea level, default is none.&#10;So, negative depth means its above mean sea level, could be rocky or reef area. &#10;Minimum depth can only be changed if both starting and goal node has not been selected.' />
                        </label>
                        <div className="flex items-center justify-between">
                            <input
                                id="depth"
                                className="w-20 items-center mr-5"
                                type="range"
                                min="-3.3"
                                max="9.1"
                                step="0.1"
                                value={minimumDepth}
                                onChange={handleDepthChange}
                                disabled={startPoint || endPoint}
                            />
                            <span className={`text-sm text-right font-bold mr-3 w-14 ${startPoint || endPoint ? 'text-gray-500' : 'text-green-400'}`}>
                                {minimumDepth} m
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 px-2">
                        <label className="ml-1 text-white flex items-center text-sm" htmlFor="minDistanceFromLand"
                        >
                            <input
                                onClick={() => setMinUseDistanceFromLand(!useMinDistanceFromLand)}
                                type="checkbox"
                                checked={useMinDistanceFromLand}
                                className="mr-2"
                                disabled={startPoint || endPoint}
                            />
                            Min Distance from Land
                            <IoMdInformationCircleOutline className='ml-2' title='Adjust the minimum distance from nearest land, default is 5m.  &#10;Min distance from land can only be changed if both starting and goal node has not been selected.' />
                        </label>
                        <div className="flex items-center justify-between">
                            <input
                                id="minDistanceFromLand"
                                className="w-20 items-center mr-5"
                                type="range"
                                min="5"
                                max="1205"
                                step="50"
                                value={minDistanceFromLand}
                                onChange={handleMinDistanceFromLandChange}
                                disabled={startPoint || endPoint}
                            />
                            <span className={`text-sm text-right font-bold mr-3 w-14 ${startPoint || endPoint ? 'text-gray-500' : 'text-green-400'}`}>
                                {minDistanceFromLand} m
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 px-2">
                        <label className="ml-1 text-white flex items-center text-sm" htmlFor="maxDistanceFromLand"
                        >
                            <input
                                onClick={() => setMaxUseDistanceFromLand(!useMaxDistanceFromLand)}
                                type="checkbox"
                                checked={useMaxDistanceFromLand}
                                className="mr-2"
                                disabled={startPoint || endPoint}
                            />
                            Max Distance from Land
                            <IoMdInformationCircleOutline className='ml-2' title='Adjust the maximum distance from nearest land, default is 22.4km (EEZ).  &#10;Max distance from land can only be changed if both starting and goal node has not been selected.' />
                        </label>
                        <div className="flex items-center justify-between">
                            <input
                                id="maxDistanceFromLand"
                                className="w-20 items-center mr-5"
                                type="range"
                                min="5"
                                max="1205"
                                step="50"
                                value={maxDistanceFromLand}
                                onChange={handleMaxDistanceFromLandChange}
                                disabled={startPoint || endPoint}
                            />
                            <span className={`text-sm text-right font-bold mr-3 w-14 ${startPoint || endPoint ? 'text-gray-500' : 'text-green-400'}`}>
                                {maxDistanceFromLand} m
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 px-2">
                        <label className="ml-1 text-white flex items-center text-sm" htmlFor="neighborDistance"
                            title=""
                            onClick={() => setUseNeighborDistance(!useNeighborDistance)}
                        >
                            <input
                                type="checkbox"
                                checked={useNeighborDistance}
                                className="mr-2"
                            />
                            Safety Radius
                            <IoMdInformationCircleOutline className='ml-2' title='Adjust the distance between neighbor nodes (safety distance between potential nodes). Neighbor nodes is generated in 8 even circular direction. default is 150m.' />
                        </label>
                        <div className="flex items-center justify-between">
                            <input
                                id="neighborDistance"
                                className="w-20 items-center mr-5"
                                type="range"
                                min="10"
                                max="250"
                                step="10"
                                value={neighborDistance}
                                onChange={handleNeighborDistanceChange}
                            />
                            <span className="text-green-400 text-sm text-right font-bold mr-3 w-14">{neighborDistance} m</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 px-2">
                        <label className="ml-1 text-white text-sm" htmlFor="speed">
                            Speed
                        </label>
                        <div className="flex items-center">
                            <input
                                id="speed"
                                className="w-20 h-2 items-center mr-3"
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={speed}
                                onChange={handleSpeedChange}
                            />
                            <span className="text-green-400 font-bold mr-3 text-right w-16 text-sm"> {speed} knot</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 px-2">
                        <label className="ml-1 text-white text-sm mb-2" htmlFor="fuelConsumption">
                            Fuel Consumption
                        </label>
                        <div>
                            <input
                                id="fuelConsumption"
                                className="text-black text-sm p-1 rounded w-20 mr-8"
                                type="number"
                                value={fuelConsumption}
                                onChange={handleFuelConsumptionChange}
                            />
                            <span className="text-green-400 font-bold text-sm ml-2 mr-3"> L/hr</span>
                        </div>
                    </div>
                </div>
            )}
            {routeLonLat && timeEstimate && (
                <div>
                    <div className="flex items-center mt-6 px-2">
                        <MdArrowDropDown className="text-white w-5 h-5 mr-1 cursor-pointer" onClick={toggleMoreInfo} />
                        <p className="text-white font-bold text-sm cursor-pointer" onClick={toggleMoreInfo}>Route Info</p>
                    </div>
                    {showMoreInfo && (
                        <div className="mt-5">
                            <p className="ml-1 mt-4 px-2 text-white text-sm flex justify-between mr-3">Distance<input className='text-green-350 font-bold rounded w-40 p-1 text-right' value={formatDistance(routeLonLat.distance)} disabled={true} /></p>
                            <p className="ml-1 mt-4 px-2 text-white text-sm flex justify-between mr-3">Time Estimate<input className='text-green-350 font-bold rounded w-40 p-1 text-right' value={(timeEstimate.timeArray[0]) + " d " + (timeEstimate.timeArray[1] + " hr " + (timeEstimate.timeArray[2] + " min"))} disabled={true} /></p>
                            <p className="ml-1 mt-4 px-2 text-white text-sm flex justify-between mr-3">Total Fuel Consumption<input className='text-green-350 font-bold rounded w-40 p-1 text-right' value={(totalFuelConsumption) + " Liter"} disabled={true} /></p>
                            <div className="flex justify-between items-center mt-4 px-2">
                                <label className="ml-1 text-white text-sm" htmlFor="departureTime">
                                    Departure Time
                                </label>
                                <input
                                    id="departureTime"
                                    className="text-black text-sm p-1 rounded w-40 mr-3"
                                    type="datetime-local"
                                    value={departureTime}
                                    onChange={handleDepartureTimeChange}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-4 px-2">
                                <label className="ml-1 text-white text-sm" htmlFor="arrivalTime">
                                    Arrival Time
                                </label>
                                <input
                                    id="arrivalTime"
                                    className="text-black text-sm p-1 rounded w-40 mr-3"
                                    type="datetime-local"
                                    value={arrivalTime}
                                    onChange={handleArrivalTimeChange}
                                />
                            </div>
                        </div>

                    )}
                </div>
            )}
            <div className="mt-4">
                <button
                    className={`w-full p-2 place-content-stretch rounded-b-2xl mt-2 text-white shadow-md ${startPoint === '' || endPoint === ''
                        ? 'bg-gray-500 cursor-not-allowed'
                        : isGeneratingRoute === 'GENERATING'
                            ? hover
                                ? 'bg-red-700 cursor-pointer'
                                : 'bg-primary cursor-not-allowed'
                            : 'bg-primary hover:bg-dark-primary cursor-pointer'
                        }`}
                    onMouseEnter={() => setHover(true)}
                    onMouseLeave={() => setHover(false)}
                    onClick={() => {
                        if (routeLonLat && timeEstimate) {
                            const layers = map.getLayers().getArray();
                            layers.forEach(layer => {
                                if (layer.get('name') === 'Route Layer') {
                                    map.removeLayer(layer);
                                    dispatch(clearRoute())
                                }
                            });
                        }
                        else if (isGeneratingRoute === "GENERATING") {
                            handleCancelRequest()
                        }
                        else {
                            handleGenerateRoute()
                        }
                    }}
                    disabled={startPoint === "" || endPoint === ""}
                >
                    {routeLonLat && timeEstimate
                        ? 'New Route'
                        : isGeneratingRoute === 'GENERATING'
                            ? hover
                                ? 'Cancel'
                                : 'Generating Route...'
                            : 'Generate Route'}
                </button>
            </div>
        </div>
    );
};

export default RoutePlanning;
