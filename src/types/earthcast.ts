/**
 * Type definitions for Earthcast Technologies API
 * Based on API version 0.1.0
 */

/**
 * Available weather product keys
 */
export type EarthcastProduct =
  | 'lightning_density'
  | 'contrails_max'
  | 'contrails'
  | 'ionospheric_density'
  | 'neutral_density'
  | 'low-level-windshear'
  | 'high-level-windshear'
  | 'turbulence_max'
  | 'reflectivity_5k';

/**
 * Spatial filtering options
 */
export interface SpatialFilter {
  /** Bounding box: west,south,east,north */
  bbox?: string;
  /** Center latitude for radius query */
  lat?: number;
  /** Center longitude for radius query */
  lon?: number;
  /** Radius in kilometers (used with lat/lon) */
  radius?: number;
}

/**
 * Altitude filtering options
 */
export interface AltitudeFilter {
  /** Single altitude in kilometers */
  alt?: number;
  /** Minimum altitude in kilometers */
  alt_min?: number;
  /** Maximum altitude in kilometers */
  alt_max?: number;
  /** Comma-separated list of specific altitudes */
  alts?: string;
}

/**
 * Time filtering options
 */
export interface TimeFilter {
  /** ISO 8601 timestamp */
  date?: string;
  /** Start of time range (ISO 8601) */
  date_start?: string;
  /** End of time range (ISO 8601) */
  date_end?: string;
}

/**
 * Resolution control options
 */
export interface ResolutionOptions {
  /** Output width in pixels */
  width?: number;
  /** Output height in pixels */
  height?: number;
}

/**
 * Common query parameters
 */
export interface BaseQueryParams extends SpatialFilter, AltitudeFilter, ResolutionOptions {}

/**
 * Arguments for Go/No-Go decision support endpoint
 */
export interface GoNoGoArgs extends BaseQueryParams, TimeFilter {
  /** One or more product keys (comma-separated) */
  products: string;
  /** Optional site description */
  site_description?: string;
  /** Threshold overrides in format "product:value,product:value" */
  threshold_override?: string;
  /** If false, use observed data; if true, use forecast data */
  get_forecast?: boolean;
}

/**
 * Arguments for forecast query endpoint
 */
export interface ForecastQueryArgs extends BaseQueryParams {
  /** Single product key */
  product: EarthcastProduct;
}

/**
 * Arguments for general weather data query endpoint
 */
export interface WeatherQueryArgs extends BaseQueryParams, TimeFilter {
  /** One or more product keys (comma-separated) */
  products: string;
}

/**
 * Arguments for product timestamp endpoint
 */
export interface ProductTimestampArgs {
  /** Product key to query */
  product: EarthcastProduct;
}

/**
 * Metadata for geospatial data
 */
export interface GeoMetadata {
  /** Bounding box [west, south, east, north] */
  bounds: [number, number, number, number];
  /** Resolution [x, y] */
  resolution: [number, number];
  /** Coordinate reference system */
  crs: string;
  /** Data timestamp */
  timestamp: string;
  /** Optional additional metadata */
  [key: string]: unknown;
}

/**
 * Geospatial data response
 */
export interface GeodataResponse {
  /** Product data */
  data: {
    /** Base64 encoded GeoTIFF raster data */
    raster?: string;
    /** Metadata about the data */
    metadata: GeoMetadata;
    /** Optional additional data formats */
    [key: string]: unknown;
  };
  /** Product keys included in response */
  products: string[];
  /** Response timestamp */
  timestamp: string;
}

/**
 * Product evaluation for Go/No-Go decision
 */
export interface ProductEvaluation {
  /** Product key */
  product: string;
  /** Go or No-Go status */
  status: 'GO' | 'NO-GO';
  /** Threshold value */
  threshold?: number;
  /** Maximum value found in data */
  max_value?: number;
  /** Minimum value found in data */
  min_value?: number;
  /** Evaluation message */
  message: string;
}

/**
 * Product time-specific evaluation
 */
export interface TimeSpecificEvaluation {
  /** Whether conditions are GO */
  go: boolean;
  /** Threshold value used */
  threshold: number;
}

/**
 * Product condition details per timestamp
 */
export interface ProductConditionDetails {
  /** Resolution in km (east-west, north-south) */
  resolution_km?: {
    east_west: number;
    north_south: number;
  };
  /** Grid width */
  width?: number;
  /** Grid height */
  height?: number;
  /** Bounding box [west, south, east, north] */
  bbox?: number[];
  /** Exception if data retrieval failed */
  exception?: string | null;
  /** Time-keyed evaluations and data */
  [timestamp: string]: TimeSpecificEvaluation | unknown;
}

/**
 * Go/No-Go decision response (actual API format)
 */
export interface GoNoGoResponse {
  /** Request parameters */
  requested?: {
    products: string[];
    alts?: number[] | null;
    alt_min?: number | null;
    alt_max?: number | null;
    time_mode?: string;
    date?: string | null;
    date_start?: string | null;
    date_end?: string | null;
    bbox?: number[] | null;
    lat_lon?: [number, number] | null;
    radius_km?: number | null;
    width?: number;
    height?: number | null;
    forecasted?: boolean | null;
  };
  /** Condition data per product */
  conditions?: {
    [product: string]: ProductConditionDetails;
  };
  /** Go/No-Go evaluation result */
  go_nogo_result: {
    /** Detailed evaluations per product and time */
    details: {
      [product: string]: {
        [timestamp: string]: TimeSpecificEvaluation;
      };
    };
    /** Overall GO/NO-GO decision */
    go: boolean;
    /** Site description */
    site_description?: string;
  };
}

/**
 * Product timestamp response
 */
export interface ProductTimestampResponse {
  /** Latest timestamp for the product */
  timestamp: string;
  /** Product key */
  product?: string;
}

/**
 * MCP Tool arguments for Earthcast data query
 */
export interface EarthcastDataToolArgs {
  /** Product keys (comma-separated or array) */
  products: string | string[];
  /** Latitude (-90 to 90) */
  latitude?: number;
  /** Longitude (-180 to 180) */
  longitude?: number;
  /** Bounding box: west,south,east,north */
  bbox?: string;
  /** Radius in kilometers (requires lat/lon) */
  radius?: number;
  /** Altitude in kilometers */
  altitude?: number;
  /** Minimum altitude in kilometers */
  altitude_min?: number;
  /** Maximum altitude in kilometers */
  altitude_max?: number;
  /** ISO 8601 timestamp */
  date?: string;
  /** Start of time range */
  date_start?: string;
  /** End of time range */
  date_end?: string;
  /** Output width in pixels */
  width?: number;
  /** Output height in pixels */
  height?: number;
}

/**
 * MCP Tool arguments for Go/No-Go decision
 */
export interface GoNoGoToolArgs extends EarthcastDataToolArgs {
  /** Launch site description */
  site_description?: string;
  /** Product thresholds as an object { product: threshold_value } */
  thresholds?: Record<string, number>;
  /** Whether to use forecast data (default: false, uses observed data) */
  use_forecast?: boolean;
}

/**
 * MCP Tool arguments for product timestamp
 */
export interface ProductTimestampToolArgs {
  /** Product key to query */
  product: EarthcastProduct | string;
}

/**
 * Error response from API
 */
export interface EarthcastErrorResponse {
  /** Error message */
  detail?: string;
  /** Error code */
  code?: string;
  /** Additional error information */
  [key: string]: unknown;
}
