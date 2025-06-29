package main

import (
	"backend/internal/database"
	"backend/internal/handlers"
	"backend/internal/middleware"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

func main() {
	// Set up logging
	logger := logrus.New()
	logger.SetFormatter(&logrus.JSONFormatter{})
	logger.SetLevel(logrus.InfoLevel)

	// Set up the database connection
	db, err := database.NewDB("file:./sample_todo_auth.db?cache=shared")
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Set up the web server
	router := gin.Default()

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status": "UP",
		})
	})

	// API routes
	api := router.Group("/api")

	// Auth routes
	authHandler := handlers.NewAuthHandler(db)
	api.POST("/login", authHandler.Login)

	// Protected routes
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())

	// User routes
	userHandler := handlers.NewUserHandler(db)
	userRoutes := protected.Group("/users")
	userRoutes.Use(middleware.AuthorizeRoleMiddleware("admin")) // Only admin can manage users
	userRoutes.GET("/", userHandler.GetUsers)
	userRoutes.POST("/", userHandler.CreateUser)
	userRoutes.PUT("/:id", userHandler.UpdateUser)
	userRoutes.DELETE("/:id", userHandler.DeleteUser)

	// Task routes
	taskHandler := handlers.NewTaskHandler(db)
	protected.GET("/tasks", taskHandler.GetTasks)
	protected.POST("/tasks", taskHandler.CreateTask)
	protected.PUT("/tasks/:id", taskHandler.UpdateTask)
	protected.DELETE("/tasks/:id", taskHandler.DeleteTask)

	// Start the server
	if err := router.Run(":8080"); err != nil {
		logger.Fatalf("Failed to start server: %v", err)
	}
}
