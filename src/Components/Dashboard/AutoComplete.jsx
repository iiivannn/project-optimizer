/* eslint-disable react/prop-types */

import React, { useState, useEffect, useRef } from "react";

import "./AutoComplete.css"; // Import your CSS file for styling

const PlaceAutocomplete = ({ accessToken, value, onChange, placeholder }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false); // Track input focus
  const suggestionsRef = useRef(null);

  const fetchSuggestions = React.useCallback(
    async (query) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        setError(null);
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            query
          )}.json?` +
            `access_token=${accessToken}&` +
            `autocomplete=true`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        setSuggestions(data.features || []);
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setError("Unable to fetch location suggestions");
        setSuggestions([]);
      }
    },
    [accessToken]
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 200);
    return () => clearTimeout(timeoutId);
  }, [value, fetchSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.place_name); // Update the input field
    setTimeout(() => {
      setSuggestions([]); // Clear suggestions
      setSelectedSuggestionIndex(-1);
      setIsFocused(false);
    }, 100);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          Math.min(prev + 1, suggestions.length - 1)
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
          e.preventDefault(); // Prevent form submission or other default behavior
        }
        break;
    }
  };

  useEffect(() => {
    // Scroll selected suggestion into view
    if (selectedSuggestionIndex >= 0 && suggestionsRef.current) {
      const suggestionElement =
        suggestionsRef.current.children[selectedSuggestionIndex];
      suggestionElement?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedSuggestionIndex]);

  return (
    <div
      className="autocomplete-container"
      onBlur={() => setTimeout(() => setIsFocused(false), 150)}
      onFocus={() => setIsFocused(true)}
    >
      <div className="input-group">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="autocomplete-input"
        />
      </div>
      {error && <div className="error-message">{error}</div>}
      {isFocused &&
        suggestions.length > 0 && ( // Only show suggestions when focused
          <ul className="suggestions-list" ref={suggestionsRef}>
            {suggestions.map((suggestion, index) => (
              <li
                key={suggestion.id}
                onMouseDown={() => handleSuggestionClick(suggestion)}
                className={`suggestion-item ${
                  index === selectedSuggestionIndex ? "selected" : ""
                }`}
              >
                {suggestion.place_name}
              </li>
            ))}
          </ul>
        )}
    </div>
  );
};

export default PlaceAutocomplete;
