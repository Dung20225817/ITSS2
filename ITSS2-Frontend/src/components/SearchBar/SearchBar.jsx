import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../api/client";

import "./SearchBar.css";
import {
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import SearchIcon from "@mui/icons-material/Search";
import { CITY_OPTIONS, toCityOptions } from "../../constants/cities";

const SearchBar = ({ gray = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState(CITY_OPTIONS);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  const handleChange = (event) => {
    setAddress(event.target.value);
  };

  const handleSearch = () => {
    const searchParams = new URLSearchParams(location.search);
    if (name) {
      searchParams.set("keyword", name);
    }
    if (address) {
      searchParams.set("address", address);
    }
    navigate(
      `/jobs?${searchParams.toString()}&sortKey=startDate&sortValue=desc`
    );
  };

  const fetchAddresses = async () => {
    try {
      const res = await apiClient.get("/api/v1/address");
      setAddresses(toCityOptions(res.data.address));
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại";
      console.error(errorMessage);
      setAddresses(CITY_OPTIONS);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  return (
    <div className={gray ? "search-bar gray" : "search-bar"}>
      <div className="search-name">
        <TextField
          label={
            <div className="search-item-label">
              <SearchIcon sx={{ color: "#222" }} />
              <span>Tên công việc</span>
            </div>
          }
          variant="outlined"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
        />
      </div>

      <div className="search-address">
        <FormControl fullWidth>
          <InputLabel id="address-label">
            <div className="search-item-label">
              <LocationOnIcon sx={{ color: "#222" }} />
              <span>Địa điểm</span>
            </div>
          </InputLabel>
          <Select
            labelId="address-label"
            id="address-select"
            value={address}
            onChange={handleChange}
            label="Chọn tùy chọn"
          >
            {addresses.length > 0 &&
              addresses.map((adr, index) => (
                <MenuItem key={`address-select-${index}`} value={adr}>
                  {adr}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </div>

      <div className="search-btn-container">
        <Button
          className="search-btn"
          variant="contained"
          color="primary"
          onClick={handleSearch}
        >
          Tìm kiếm
        </Button>
      </div>
    </div>
  );
};

export default SearchBar;
