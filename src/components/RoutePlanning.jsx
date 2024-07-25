import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setIsSwapClicked, setIsNodeValid } from '../states/global/action';
import { getRouteDispatch } from '../states/map/action';
import startIcon from '../assets/RiShip2Line.svg';
import { Vector as VectorSource } from 'ol/source';
import endIcon from '../assets/FaLocationDot.svg';
import { Vector as VectorLayer } from 'ol/layer';
import { Style, Icon } from 'ol/style';
import Draw from 'ol/interaction/Draw';
import { toast } from 'react-toastify';
import { fromLonLat } from 'ol/proj';
import { transform } from 'ol/proj';
import { Point } from 'ol/geom';
import Feature from 'ol/Feature';

import { BsFillExclamationCircleFill } from "react-icons/bs";
import { IoSwapVerticalOutline } from "react-icons/io5";
import { RiShip2Line } from "react-icons/ri";
import { MdArrowDropDown } from "react-icons/md";
import { FaLocationDot } from "react-icons/fa6";
import { MdMyLocation } from "react-icons/md";
import { FaTimes } from "react-icons/fa";
import { FaUndo } from "react-icons/fa";
import { set } from 'ol/transform';

import 'react-toastify/dist/ReactToastify.css';
const turf = require('@turf/turf');

const RoutePlanning = ({ undoDrawing, stopDrawing, isRestrictedArea, setIsRestrictedArea, isSelectingStart, isSelectingEnd, setIsSelectingStart, setIsSelectingEnd, setRoutePointType, source, safePriorityRate, setSafePriorityRate, distancePriorityRate, setDistancePriorityRate, routeLayer, setRouteLayer, startPoint, endPoint, setStartPoint, setEndPoint, map, setRoutePointFeature }) => {
    const dispatch = useDispatch();
    const [startCoords, setStartCoords] = useState([]);
    const [endCoords, setEndCoords] = useState([]);
    const [showMoreParams, setShowMoreParams] = useState(false);
    const [showMoreInfo, setShowMoreInfo] = useState(true);
    const [minimumDepth, setMinimumDepth] = useState(9.1);
    const [useMinimumDepth, setUseMinimumDepth] = useState(true);
    const [maxDistanceFromLand, setMaxDistanceFromLand] = useState(250);
    const [useDistanceFromLand, setUseDistanceFromLand] = useState(true);
    const [speed, setSpeed] = useState(20);
    const [fuelConsumption, setFuelConsumption] = useState(2500);

    const [departureTime, setDepartureTime] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');

    const lndarea = useSelector((state) => state.layers.s57.lndare);
    const depare = useSelector((state) => state.layers.s57.depare);
    const drgare = useSelector((state) => state.layers.s57.drgare);
    const routeLonLat = useSelector((state) => state.layers.route);

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

    const handleMaxxDistanceFromLandChange = (e) => {
        setMaxDistanceFromLand(e.target.value);
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
            return `${Math.round(distance)} M`;
        } else {
            return `${(distance / 1000).toFixed(2)} Km`;
        }
    };

    const calculateTimeEstimate = (distance, speed) => {
        if (distance >= 1000) {
            distance = distance / 1000; // Convert to km
        }
        return (distance / (speed * 1.852)).toFixed(2); // Speed in knots to km/h
    };

    const calculateFuelConsumption = (time, fuelConsumptionRate) => {
        const fuel = (time * fuelConsumptionRate).toFixed(2);
        return formatNumber(fuel);
    };

    if (routeLonLat && routeLonLat.distance) {
        timeEstimate = calculateTimeEstimate(routeLonLat.distance, speed);
        totalFuelConsumption = calculateFuelConsumption(timeEstimate, fuelConsumption);
    }

    const handleDepartureTimeChange = (e) => {
        const departTime = e.target.value;
        setDepartureTime(departTime);
        if (routeLonLat.distance && speed) {
            const arrival = new Date(departTime);
            arrival.setHours(arrival.getHours() + parseFloat(timeEstimate));
            setArrivalTime(arrival.toISOString().slice(0, 16));
        }
    };

    const handleArrivalTimeChange = (e) => {
        const arriveTime = e.target.value;
        setArrivalTime(arriveTime);
        if (routeLonLat.distance && speed) {
            const departure = new Date(arriveTime);
            departure.setHours(departure.getHours() - parseFloat(timeEstimate));
            setDepartureTime(departure.toISOString().slice(0, 16));
        }
    };

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
        const handleMapClick = (evt) => {
            const coordinates = transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
            // Check if the point is within any S57 data polygons

            lndarea.forEach((feature) => {
                if ((isSelectingStart || isSelectingEnd) && turf.booleanPointInPolygon(turf.point(coordinates), feature.geometry)) {
                    dispatch(setIsNodeValid("IN LAND AREA"))
                    showToast("Selected point is inside a land area. Please select another location.")
                }
            });

            if (minimumDepth) {
                depare.forEach((feature) => {
                    if ((isSelectingStart || isSelectingEnd) && turf.booleanPointInPolygon(turf.point(coordinates), feature.geometry) && minimumDepth > feature.properties.drval1) {
                        console.log("masuk sini");
                        console.log(feature.properties.drval1);
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
            } else if (isSelectingEnd) {
                setEndPoint(`${coordinates[0].toFixed(8)}, ${coordinates[1].toFixed(8)}`);
                setEndCoords(coordinates);
                setIsSelectingEnd(false);
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
    }, [map, isSelectingStart, isSelectingEnd, minimumDepth]);

    return (
        <div className="bg-primary-container rounded-2xl absolute left-0 top-0 mt-4 ml-12 w-sea-route">
            <div className="bg-primary-container text-white p-3 rounded-2xl flex justify-between items-center">
                <p className="mr-2 text-lg font-bold">Sea Route</p>
                <button
                    id='undoDrawing'
                    className={` p-2.5 text-white cursor-pointer ml-1 mr-2 hover:text-gray-200`}
                    onClick={undoDrawing}
                >
                    <FaUndo />
                </button>
            </div>
            <div className="flex items-center mt-2 px-2">
                <button
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
                        <label className="ml-1 text-white flex items-center text-sm" htmlFor="depth">
                            <input
                                type="checkbox"
                                checked={useMinimumDepth}
                                onChange={() => setUseMinimumDepth(!useMinimumDepth)}
                                className="mr-2"
                            />
                            Minimum Depth:
                        </label>
                        <div className="flex items-center justify-between">
                            <input
                                id="depth"
                                className="w-20 items-center mr-6"
                                type="range"
                                min="-3.3"
                                max="9.1"
                                step="0.1"
                                value={minimumDepth}
                                onChange={handleDepthChange}
                                disabled={startPoint || endPoint}
                            />
                            <span className="text-green-400 font-bold text-sm mr-3"> {minimumDepth} M</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 px-2">
                        <label className="ml-1 text-white flex items-center text-sm" htmlFor="distanceFromLand">
                            <input
                                type="checkbox"
                                checked={useDistanceFromLand}
                                onChange={() => setUseDistanceFromLand(!useDistanceFromLand)}
                                className="mr-2"
                            />
                            Distance From Land:
                        </label>
                        <div className="flex items-center">
                            <input
                                id="distanceFromLand"
                                className="w-20 items-center mr-6"
                                type="range"
                                min="20"
                                max="1000"
                                step="10"
                                value={maxDistanceFromLand}
                                onChange={handleMaxxDistanceFromLandChange}
                                disabled={startPoint || endPoint}
                            />
                            <span className="text-green-400 text-sm font-bold mr-3">{maxDistanceFromLand} M</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 px-2">
                        <label className="ml-1 text-white text-sm" htmlFor="speed">
                            Speed:
                        </label>
                        <div className="flex items-center">
                            <input
                                id="speed"
                                className="w-20 h-2 items-center"
                                type="range"
                                min="1"
                                max="50"
                                step="1"
                                value={speed}
                                onChange={handleSpeedChange}
                            />
                            <span className="text-green-400 font-bold ml-2 mr-3 text-sm"> {speed} Knots</span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 px-2">
                        <label className="ml-1 text-white text-sm mb-2" htmlFor="fuelConsumption">
                            Fuel Consumption:
                        </label>
                        <div>
                            <input
                                id="fuelConsumption"
                                className="text-black text-sm p-1 rounded w-20"
                                type="number"
                                value={fuelConsumption}
                                onChange={handleFuelConsumptionChange}
                            />
                            <span className="text-green-400 font-bold text-sm ml-2 mr-3"> L/hr</span>
                        </div>
                    </div>
                </div>
            )}
            {routeLonLat && (
                <div>
                    <div className="flex items-center mt-6 px-2">
                        <MdArrowDropDown className="text-white w-5 h-5 mr-1 cursor-pointer" onClick={toggleMoreInfo} />
                        <p className="text-white font-bold text-sm cursor-pointer" onClick={toggleMoreInfo}>Route Info</p>
                    </div>
                    {showMoreInfo && (
                        <div className="mt-5">
                            <p className="ml-1 mt-4 px-2 text-white text-sm flex justify-between mr-3">Distance: <span className='text-blue-500 font-bold'>{formatDistance(routeLonLat.distance)}</span></p>
                            <p className="ml-1 mt-4 px-2 text-white text-sm flex justify-between mr-3">Time Estimate: <span className='text-blue-500 font-bold'>{(timeEstimate)} hrs</span></p>
                            <p className="ml-1 mt-4 px-2 text-white text-sm flex justify-between mr-3">Total Fuel Consumption: <span className='text-blue-500 font-bold'>{totalFuelConsumption} L</span></p>
                            <div className="flex justify-between items-center mt-6 px-2">
                                <label className="ml-1 text-white text-sm" htmlFor="departureTime">
                                    Departure Time:
                                </label>
                                <input
                                    id="departureTime"
                                    className="text-black text-sm p-1 rounded w-48 mr-3"
                                    type="datetime-local"
                                    value={departureTime}
                                    onChange={handleDepartureTimeChange}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-4 px-2">
                                <label className="ml-1 text-white text-sm" htmlFor="arrivalTime">
                                    Arrival Time:
                                </label>
                                <input
                                    id="arrivalTime"
                                    className="text-black text-sm p-1 rounded w-48 mr-3"
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
                    className={`w-full p-2 place-content-stretch rounded-b-2xl mt-2 text-white shadow-md ${startPoint === "" || endPoint === ""
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-primary hover:bg-dark-primary cursor-pointer"
                        }`}
                    onClick={() => {
                        dispatch(getRouteDispatch(startCoords, endCoords, minimumDepth));
                    }}
                    disabled={startPoint === "" || endPoint === ""}
                >
                    Generate Route
                </button>
            </div>
        </div>
    );
};

export default RoutePlanning;
