/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import "./PlaceAutocomplete.css";

function PlaceAutocomplete({
  accessToken,
  value,
  onChange,
  placeholder,
  userLocation,
  inputClassName = "autocomplete-input",
  suggestionsClassName = "suggestions-list",
  itemClassName = "suggestion-item",
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Enhanced search with nationwide Philippines coverage
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Add proximity parameter if user location is available for nearby bias
      // but we won't restrict results to only nearby locations
      let proximityParam = "";
      if (userLocation) {
        proximityParam = `&proximity=${userLocation.longitude},${userLocation.latitude}`;
      }

      // Parallel API calls for different place types to ensure comprehensive coverage
      const fetchPromises = [
        // POIs with high limit (malls, hospitals, schools, etc.)
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${accessToken}&country=ph&types=poi&limit=5${proximityParam}`
        ),

        // Addresses and places
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${accessToken}&country=ph&types=address,place&limit=3${proximityParam}`
        ),

        // Localities, neighborhoods and regions for broader coverage
        fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?access_token=${accessToken}&country=ph&types=locality,neighborhood,region&limit=2${proximityParam}`
        ),
      ];

      // Wait for all requests to complete
      const responses = await Promise.all(fetchPromises);
      const dataPromises = responses.map((response) => response.json());
      const [poiData, addressData, localityData] = await Promise.all(
        dataPromises
      );

      // Combine and deduplicate results
      const combinedFeatures = [...poiData.features];

      // Helper to check for duplicates
      const isDuplicate = (feature) => {
        return combinedFeatures.some((existing) => existing.id === feature.id);
      };

      // Add other results while avoiding duplicates
      [...addressData.features, ...localityData.features].forEach((feature) => {
        if (!isDuplicate(feature)) {
          combinedFeatures.push(feature);
        }
      });

      // Format suggestions to display more meaningful place information
      const formattedSuggestions = combinedFeatures.map((feature) => {
        // Get feature type and properties
        const placeType = feature.place_type && feature.place_type[0];
        let category = feature.properties?.category || placeType || "";

        // More descriptive categories for better user understanding
        if (placeType === "poi") {
          // Try to derive a more specific category from the maki icon if available
          if (feature.properties?.maki) {
            const maki = feature.properties.maki;
            if (maki === "school") category = "School/University";
            else if (maki === "hospital") category = "Hospital/Clinic";
            else if (maki === "shop") category = "Shopping Mall";
            else if (maki === "restaurant") category = "Restaurant";
            else if (maki === "lodging") category = "Hotel";
            else category = capitalizeFirstLetter(maki);
          }
        } else if (placeType === "address") {
          category = "Address";
        } else if (placeType === "place") {
          category = "City/Town";
        } else if (placeType === "locality") {
          category = "Locality";
        } else if (placeType === "neighborhood") {
          category = "Neighborhood";
        } else if (placeType === "region") {
          category = "Province/Region";
        }

        // Extract main place name
        const placeName = feature.text;

        // Format place context information with better readability
        let contextInfo = "";
        if (feature.context && feature.context.length > 0) {
          // Filter out redundant or less useful context elements
          const relevantContext = feature.context.filter((ctx) => {
            // Skip if ID starts with these prefixes (adjust based on your needs)
            if (
              ctx.id.startsWith("postcode.") ||
              ctx.id.startsWith("country.")
            ) {
              return false;
            }
            return true;
          });

          contextInfo = relevantContext
            .map((ctx) => ctx.text)
            .filter(Boolean)
            .join(", ");
        }

        // For POIs, include the maki icon if available
        const poiIcon = feature.properties?.maki || "";

        return {
          id: feature.id,
          placeName: placeName,
          fullName: feature.place_name,
          context: contextInfo,
          center: feature.center,
          properties: feature.properties || {},
          poiType: category,
          poiIcon: poiIcon,
          placeType: placeType,
          bbox: feature.bbox, // Include bounding box if available for large features
        };
      });

      setSuggestions(formattedSuggestions);
      setShowSuggestions(formattedSuggestions.length > 0);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };

  // Handle input change with debounce
  const handleInputChange = (e) => {
    const query = e.target.value;
    onChange(query);

    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounce
    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(query);
    }, 300);
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.fullName);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  // Close suggestions panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target) &&
        !inputRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get icon for suggestion based on category/type
  const getIconForType = (suggestion) => {
    // Use maki icon if available
    if (suggestion.poiIcon) {
      return suggestion.poiIcon;
    }

    // Default icons based on place type
    switch (suggestion.placeType) {
      case "poi":
        return "marker";
      case "address":
        return "building";
      case "place":
        return "city";
      case "region":
        return "map";
      case "locality":
      case "neighborhood":
        return "circle";
      default:
        return "map-pin";
    }
  };

  return (
    <div className="autocomplete-container">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        onFocus={() =>
          value && suggestions.length > 0 && setShowSuggestions(true)
        }
        className={inputClassName}
      />

      {isLoading && <div className="loading-indicator">Loading...</div>}

      {showSuggestions && suggestions.length > 0 && (
        <ul ref={suggestionsRef} className={suggestionsClassName}>
          {suggestions.map((suggestion) => {
            const icon = getIconForType(suggestion);
            return (
              <li
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className={itemClassName}
              >
                {icon && (
                  <span className="place-icon" aria-hidden="true">
                    <i className={`mapbox-icon icon-${icon}`}></i>
                  </span>
                )}
                <div className="suggestion-content">
                  <strong>{suggestion.placeName}</strong>
                  {suggestion.context && (
                    <span className="context">{suggestion.context}</span>
                  )}
                </div>
                {suggestion.poiType && (
                  <span className="poi-type">{suggestion.poiType}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default PlaceAutocomplete;
