package handlers

import (
	"backend/internal/models"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	db *bun.DB
}

// NewAuthHandler creates a new AuthHandler
func NewAuthHandler(db *bun.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// LoginRequest represents the login request body
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := new(models.User)
	if err := h.db.NewSelect().Model(user).Where("username = ?", req.Username).Relation("Role").Scan(c.Request.Context()); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"role":     user.Role.Name,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	})

	// TODO: Load secret key from environment variable
	tokenString, err := token.SignedString([]byte("your_secret_key")) // Replace with a strong secret key
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": tokenString})
}

