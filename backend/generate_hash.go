package main

import (
	"fmt"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	hash, err := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error hashing password:", err)
		return
	}
	fmt.Println(string(hash))
}
