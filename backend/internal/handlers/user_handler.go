package handlers

import (
	"backend/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
	"golang.org/x/crypto/bcrypt"
)

// UserHandler handles user-related requests
type UserHandler struct {
	db *bun.DB
}

// NewUserHandler creates a new UserHandler
func NewUserHandler(db *bun.DB) *UserHandler {
	return &UserHandler{db: db}
}

// UserCreateRequest represents the request body for creating a user
type UserCreateRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
	RoleID   int64  `json:"role_id" binding:"required"`
}

// UserUpdateRequest represents the request body for updating a user
type UserUpdateRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	RoleID   int64  `json:"role_id"`
}

// GetUsers handles fetching all users
func (h *UserHandler) GetUsers(c *gin.Context) {
	var users []models.User
	if err := h.db.NewSelect().Model(&users).Relation("Role").Scan(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}
	c.JSON(http.StatusOK, users)
}

// CreateUser handles creating a new user
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req UserCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	user := &models.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		RoleID:       req.RoleID,
	}

	if _, err := h.db.NewInsert().Model(user).Exec(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

// UpdateUser handles updating a user
func (h *UserHandler) UpdateUser(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UserUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := new(models.User)
	user.ID = id

	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.PasswordHash = string(hashedPassword)
	}
	if req.RoleID != 0 {
		user.RoleID = req.RoleID
	}

	if _, err := h.db.NewUpdate().Model(user).WherePK().Exec(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// DeleteUser handles deleting a user
func (h *UserHandler) DeleteUser(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user := new(models.User)
	user.ID = id

	if _, err := h.db.NewDelete().Model(user).WherePK().Exec(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}
