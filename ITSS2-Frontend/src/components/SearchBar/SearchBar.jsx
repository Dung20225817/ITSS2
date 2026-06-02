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

const SearchBar = ({ gray = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState([]);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  console.log(addresses);

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
      console.log(res);
      setAddresses(res.data.address);
    } catch (err) {
      const errorMessage =
        err.response && err.response.data && err.response.data.message
          ? err.response.data.message
          : "Đã có lỗi xảy ra. Vui lòng thử lại";
      console.log(errorMessage);
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
              <SearchIcon sx={{ color: "#6300b3" }} />
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
              <LocationOnIcon sx={{ color: "#6300b3" }} />
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
