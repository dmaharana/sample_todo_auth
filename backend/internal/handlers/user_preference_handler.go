package handlers

import (
	"backend/internal/models"
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
	userID := c.MustGet("userID").(int64)
	key := c.Param("key")

	var preference models.UserPreference
	err := h.db.NewSelect().Model(&preference).Where("user_id = ? AND key = ?", userID, key).Scan(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Preference not found"})
		return
	}

	c.JSON(http.StatusOK, preference)
}

func (h *UserPreferenceHandler) SetUserPreference(c *gin.Context) {
	userID := c.MustGet("userID").(int64)

	var req SetUserPreferenceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	preference := models.UserPreference{
		UserID: userID,
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
