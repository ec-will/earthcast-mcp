/**
 * Types for NOAA Climate Data Online (CDO) API v2
 * Documentation: https://www.ncdc.noaa.gov/cdo-web/webservices/v2
 */

/**
 * CDO API Error Response
 */
export interface CDOErrorResponse {
  status: string;
  message: string;
}

/**
 * Metadata included in collection responses
 */
export interface CDOResultSet {
  offset: number;
  count: number;
  limit: number;
}

/**
 * Location response from CDO API
 */
export interface CDOLocation {
  id: string;
  name: string;
  datacoverage: number;
  mindate: string;
  maxdate: string;
}

export interface CDOLocationCollectionResponse {
  metadata: CDOResultSet;
  results: CDOLocation[];
}

/**
 * Station response from CDO API
 */
export interface CDOStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  elevation: number;
  elevationUnit: string;
  datacoverage: number;
  mindate: string;
  maxdate: string;
}

export interface CDOStationCollectionResponse {
  metadata: CDOResultSet;
  results: CDOStation[];
}

/**
 * Dataset response from CDO API
 */
export interface CDODataset {
  id: string;
  name: string;
  datacoverage: number;
  mindate: string;
  maxdate: string;
}

export interface CDODatasetCollectionResponse {
  metadata: CDOResultSet;
  results: CDODataset[];
}

/**
 * Data type response from CDO API
 */
export interface CDODataType {
  id: string;
  name: string;
  datacoverage: number;
  mindate: string;
  maxdate: string;
}

export interface CDODataTypeCollectionResponse {
  metadata: CDOResultSet;
  results: CDODataType[];
}

/**
 * Observation data from CDO API
 */
export interface CDOData {
  date: string;
  datatype: string;
  station: string;
  attributes: string;
  value: number;
}

export interface CDODataCollectionResponse {
  metadata: CDOResultSet;
  results: CDOData[];
}
