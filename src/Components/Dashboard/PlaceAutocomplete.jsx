/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from "react";
import "./PlaceAutocomplete.css";

function PlaceAutocomplete({
  accessToken,
  value,
  onChange,
  placeholder,
  userLocation,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Enhanced search with better POI handling
  const fetchSuggestions = async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Add proximity parameter if user location is available
      let proximityParam = "";
      if (userLocation) {
        proximityParam = `&proximity=${userLocation.longitude},${userLocation.latitude}`;
      }

      // First attempt: Direct POI search with high limit
      const directPoiUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${accessToken}&country=ph&types=poi&limit=5${proximityParam}`;

      const poiResponse = await fetch(directPoiUrl);
      const poiData = await poiResponse.json();

      // Second attempt: General search for remaining slots
      const generalUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        query
      )}.json?access_token=${accessToken}&country=ph&types=address,place,locality,neighborhood,postcode&limit=3${proximityParam}`;

      const generalResponse = await fetch(generalUrl);
      const generalData = await generalResponse.json();

      // Combine and deduplicate results
      const combinedFeatures = [...poiData.features];

      // Add general results that don't duplicate POIs
      generalData.features.forEach((feature) => {
        const isDuplicate = combinedFeatures.some(
          (existing) => existing.place_name === feature.place_name
        );

        if (!isDuplicate) {
          combinedFeatures.push(feature);
        }
      });

      // Format suggestions to display more meaningful place information
      const formattedSuggestions = combinedFeatures.map((feature) => {
        // Get feature type and properties
        const placeType = feature.place_type && feature.place_type[0];
        const category = feature.properties?.category || placeType || "";

        // Extract main place name
        const placeName = feature.text;

        // Format place context information
        const contextInfo = feature.context
          ?.map((ctx) => ctx.text)
          .filter(Boolean)
          .join(", ");

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
        className="autocomplete-input"
      />

      {isLoading && <div className="loading-indicator">Loading...</div>}

      {showSuggestions && suggestions.length > 0 && (
        <ul ref={suggestionsRef} className="suggestions-list">
          {suggestions.map((suggestion) => {
            const icon = getIconForType(suggestion);
            return (
              <li
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="suggestion-item"
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
