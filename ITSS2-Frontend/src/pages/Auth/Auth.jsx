import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import {
  LockRounded,
  MailRounded,
  PersonRounded,
  VisibilityOffRounded,
  VisibilityRounded,
} from "@mui/icons-material";
import { useAuth } from "../../contexts/AuthContext";
import "./Auth.css";

const Auth = ({ initialMode = "login" }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const isRegister = mode === "register";

  const title = useMemo(
    () => (isRegister ? "Tạo tài khoản mới" : "Đăng nhập"),
    [isRegister]
  );

  const handleChange = (field) => (event) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(form);
      } else {
        await login({
          email: form.email,
          password: form.password,
        });
      }
      navigate("/profile", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Không thể xử lý yêu cầu. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="auth-page">
      <Container maxWidth="lg" className="auth-shell">
        <Box className="auth-brand">
          <Link to="/" className="auth-logo">
            ITSS2 Jobs
          </Link>
          <Typography variant="h3" className="auth-heading">
            Kết nối sinh viên với công việc phù hợp
          </Typography>
          <Typography className="auth-copy">
            Quản lý hồ sơ, lịch rảnh và danh sách việc gợi ý trong một tài
            khoản bảo mật với JWT và cookie httpOnly.
          </Typography>
        </Box>

        <Paper elevation={0} className="auth-panel">
          <Tabs
            value={mode}
            onChange={(_, value) => {
              setMode(value);
              setError("");
            }}
            variant="fullWidth"
            className="auth-tabs"
          >
            <Tab value="login" label="Đăng nhập" />
            <Tab value="register" label="Đăng ký" />
          </Tabs>

          <Box component="form" className="auth-form" onSubmit={handleSubmit}>
            <Stack spacing={2.25}>
              <Box>
                <Typography variant="h5" className="auth-form-title">
                  {title}
                </Typography>
                <Typography className="auth-form-subtitle">
                  {isRegister
                    ? "Nhập thông tin để bắt đầu tạo hồ sơ tìm việc."
                    : "Sử dụng email và mật khẩu của bạn để tiếp tục."}
                </Typography>
              </Box>

              {error && <Alert severity="error">{error}</Alert>}

              {isRegister && (
                <TextField
                  label="Họ và tên"
                  value={form.name}
                  onChange={handleChange("name")}
                  required
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRounded />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              <TextField
                label="Email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                required
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailRounded />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Mật khẩu"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={handleChange("password")}
                required
                fullWidth
                inputProps={{ minLength: 8 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Toggle password visibility"
                        edge="end"
                        onClick={() => setShowPassword((value) => !value)}
                      >
                        {showPassword ? (
                          <VisibilityOffRounded />
                        ) : (
                          <VisibilityRounded />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                className="auth-submit"
              >
                {submitting
                  ? "Đang xử lý..."
                  : isRegister
                    ? "Tạo tài khoản"
                    : "Đăng nhập"}
              </Button>
            </Stack>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Auth;
