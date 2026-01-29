import React, { memo } from "react";
import ChoferMapView from "./ChoferMapView";

const StableMap = ({ posicion }) => {
  return <ChoferMapView posicion={posicion} />;
};

export default memo(StableMap);
