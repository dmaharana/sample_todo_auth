package handlers

import (
	"backend/internal/models"
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

type UserPreferenceHandler struct {
	db *bun.DB
}

func NewUserPreferenceHandler(db *bun.DB) *UserPreferenceHandler {
	return &UserPreferenceHandler{db: db}
}

type SetUserPreferenceRequest struct {
	Key   string `json:"key" binding:"required"`
	Value string `json:"value" binding:"required"`
}

func (h *UserPreferenceHandler) GetUserPreference(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	id, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type in context"})
		return
	}

	key := c.Param("key")

	var preference models.UserPreference
	err := h.db.NewSelect().Model(&preference).Where("user_id = ? AND key = ?", id, key).Scan(c.Request.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "Preference not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch preference"})
		}
		return
	}

	c.JSON(http.StatusOK, preference)
}

func (h *UserPreferenceHandler) SetUserPreference(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User ID not found in context"})
		return
	}

	id, ok := userID.(int64)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user ID type in context"})
		return
	}

	var req SetUserPreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	preference := models.UserPreference{
		UserID: id,
		Key:    req.Key,
		Value:  req.Value,
	}

	_, err := h.db.NewInsert().Model(&preference).On("CONFLICT(user_id, key) DO UPDATE SET value = EXCLUDED.value").Exec(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set preference"})
		return
	}

	c.JSON(http.StatusOK, preference)
}
