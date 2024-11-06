<template>
  <div class="login">
    <div class="login-container">
      <div class="login-box">
        <!-- Logo区域 -->
        <div class="logo">
          <svg-icon icon-class="logo" class="logo-icon" />
        </div>
        
        <h1 class="welcome-text">TechMind智能工程助手</h1>
        <p class="sub-title">请登录您的账号</p>

        <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              type="text"
              placeholder="账号"
              :prefix-icon="'el-icon-user'"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="密码"
              :prefix-icon="'el-icon-lock'"
              @keyup.enter.native="handleLogin"
            />
          </el-form-item>

          <div class="remember-forgot">
            <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
            <a href="#" class="forgot-link">忘记密码？</a>
          </div>

          <el-button
            :loading="loading"
            type="primary"
            class="login-button"
            @click.native.prevent="handleLogin"
          >
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>

          <div class="register-link" v-if="register">
            <span>还没有账号？</span>
            <router-link to="/register">立即注册</router-link>
          </div>
        </el-form>
      </div>
    </div>
    
    <div class="el-login-footer">
      <span>By NiuZi Are Right Team Design</span>
    </div>
  </div>
</template>

<script>
import Cookies from "js-cookie";
import { encrypt, decrypt } from '@/utils/jsencrypt'

export default {
  name: "Login",
  data() {
    return {
      loginForm: {
        username: "admin",
        password: "admin123",
        rememberMe: false
      },
      loginRules: {
        username: [
          { required: true, trigger: "blur", message: "请输入您的账号" }
        ],
        password: [
          { required: true, trigger: "blur", message: "请输入您的密码" }
        ]
      },
      loading: false,
      // 注册开关
      register: false,
      redirect: undefined
    };
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect;
      },
      immediate: true
    }
  },
  created() {
    this.getCookie();
  },
  methods: {
    getCookie() {
      const username = Cookies.get("username");
      const password = Cookies.get("password");
      const rememberMe = Cookies.get('rememberMe')
      this.loginForm = {
        username: username === undefined ? this.loginForm.username : username,
        password: password === undefined ? this.loginForm.password : decrypt(password),
        rememberMe: rememberMe === undefined ? false : Boolean(rememberMe)
      };
    },
    handleLogin() {
      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.loading = true;
          if (this.loginForm.rememberMe) {
            Cookies.set("username", this.loginForm.username, { expires: 30 });
            Cookies.set("password", encrypt(this.loginForm.password), { expires: 30 });
            Cookies.set('rememberMe', this.loginForm.rememberMe, { expires: 30 });
          } else {
            Cookies.remove("username");
            Cookies.remove("password");
            Cookies.remove('rememberMe');
          }
          this.$store.dispatch("Login", this.loginForm).then(() => {
            this.$router.push({ path: this.redirect || "/" }).catch(()=>{});
          }).catch(() => {
            this.loading = false;
          });
        }
      });
    }
  }
};
</script>

<style lang="scss">
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);

  .login-container {
    width: 100%;
    max-width: 420px;
    padding: 20px;
  }

  .login-box {
    background: rgba(255, 255, 255, 0.98);
    border-radius: 24px;
    padding: 40px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
    backdrop-filter: blur(10px);
  }

  .logo {
    text-align: center;
    margin-bottom: 30px;
    
    .logo-icon {
      width: 64px;
      height: 64px;
    }
  }

  .welcome-text {
    font-size: 28px;
    font-weight: 600;
    color: #2c3e50;
    text-align: center;
    margin-bottom: 8px;
  }

  .sub-title {
    font-size: 16px;
    color: #94a3b8;
    text-align: center;
    margin-bottom: 40px;
  }

  .login-form {
    .el-form-item {
      margin-bottom: 24px;
      
      .el-input {
        height: 44px;
        
        input {
          height: 44px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding-left: 44px;
          color: #2c3e50;
          font-size: 15px;
          transition: all 0.3s;
          
          &:focus {
            background: #fff;
            border-color: #60a5fa;
            box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
          }
          
          &::placeholder {
            color: #94a3b8;
          }
        }
        
        .el-input__prefix {
          left: 16px;
          color: #94a3b8;
          font-size: 18px;
        }
      }
    }

    .remember-forgot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      
      .el-checkbox {
        color: #64748b;
        
        .el-checkbox__label {
          font-size: 14px;
        }

        .el-checkbox__input.is-checked .el-checkbox__inner {
          background-color: #60a5fa;
          border-color: #60a5fa;
        }
      }
      
      .forgot-link {
        font-size: 14px;
        color: #60a5fa;
        text-decoration: none;
        
        &:hover {
          color: #3b82f6;
          text-decoration: underline;
        }
      }
    }

    .login-button {
      width: 100%;
      height: 44px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 500;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border: none;
      margin-bottom: 24px;
      transition: all 0.3s;
      
      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }
      
      &:active {
        transform: translateY(0);
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      }
    }

    .register-link {
      text-align: center;
      font-size: 14px;
      color: #64748b;
      
      a {
        color: #60a5fa;
        text-decoration: none;
        margin-left: 4px;
        
        &:hover {
          color: #3b82f6;
          text-decoration: underline;
        }
      }
    }
  }
}

.el-login-footer {
  position: fixed;
  bottom: 0;
  width: 100%;
  text-align: center;
  padding: 20px 0;
  color: #64748b;
  font-size: 12px;
}
</style>
