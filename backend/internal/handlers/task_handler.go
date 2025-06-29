package handlers

import (
	"backend/internal/models"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/uptrace/bun"
)

// TaskHandler handles task-related requests
type TaskHandler struct {
	db *bun.DB
}

// NewTaskHandler creates a new TaskHandler
func NewTaskHandler(db *bun.DB) *TaskHandler {
	return &TaskHandler{db: db}
}

// TaskCreateRequest represents the request body for creating a task
type TaskCreateRequest struct {
	Title  string `json:"title" binding:"required"`
	Done   bool   `json:"done"`
	UserID int64  `json:"user_id" binding:"required"`
}

// TaskUpdateRequest represents the request body for updating a task
type TaskUpdateRequest struct {
	Title string `json:"title"`
	Done  bool   `json:"done"`
}

// GetTasks handles fetching all tasks
func (h *TaskHandler) GetTasks(c *gin.Context) {
	var tasks []models.Task
	if err := h.db.NewSelect().Model(&tasks).Relation("User").Scan(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tasks"})
		return
	}
	c.JSON(http.StatusOK, tasks)
}

// CreateTask handles creating a new task
func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req TaskCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task := &models.Task{
		Title:  req.Title,
		Done:   req.Done,
		UserID: req.UserID,
	}

	if _, err := h.db.NewInsert().Model(task).Exec(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	c.JSON(http.StatusCreated, task)
}

// UpdateTask handles updating a task
func (h *TaskHandler) UpdateTask(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	var req TaskUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task := new(models.Task)
	task.ID = id

	if req.Title != "" {
		task.Title = req.Title
	}
	task.Done = req.Done

	if _, err := h.db.NewUpdate().Model(task).WherePK().Exec(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	c.JSON(http.StatusOK, task)
}

// DeleteTask handles deleting a task
func (h *TaskHandler) DeleteTask(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseInt(idParam, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid task ID"})
		return
	}

	task := new(models.Task)
	task.ID = id

	if _, err := h.db.NewDelete().Model(task).WherePK().Exec(c.Request.Context()); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
