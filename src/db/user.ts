import { db } from "./db"

import { User } from "./db"

export async function addUser(input: Omit<User, "id">) {
  return db.transaction("rw", db.users, async () => {
    if (input.current) {
      await db.users.where("current").equals(1).modify({ current: 0 })
    }
    return db.users.add(input)
  })
}


export async function getAllUsers(): Promise<User[]> {
  return db.users.toArray()
}

export async function getUserById(id: number): Promise<User | undefined> {
  return db.users.get(id)
}


export async function getCurrentUser(): Promise<User | undefined> {
  return db.users.where("current").equals(1).first()
}

export async function updateUser(
  id: number,
  changes: Partial<Omit<User, "id">>
) {
  return db.transaction("rw", db.users, async () => {
    if (changes.current === 1) {
      await db.users.where("current").equals(1).modify({ current: 0 })
    }
    await db.users.update(id, changes)
  })
}

export async function setCurrentUser(id: number) {
  return db.transaction("rw", db.users, async () => {
    await db.users.where("current").equals(1).modify({ current: 0 })
    await db.users.update(id, { current: 1 })
  })
}

export async function deleteUser(id: number) {
  return db.users.delete(id)
}
